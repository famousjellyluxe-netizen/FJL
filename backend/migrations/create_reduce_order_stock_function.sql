-- Migration: Create atomic stock reduction function for orders
-- Description: Ensures all stock reductions for order items happen atomically in a single transaction
-- Purpose: Prevents race conditions when processing multi-item orders

-- Drop the function if it exists (for idempotency)
DROP FUNCTION IF EXISTS reduce_order_stock(UUID) CASCADE;

-- Create the function that atomically reduces stock for all items in an order
CREATE OR REPLACE FUNCTION reduce_order_stock(p_order_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  reduced_items INT,
  product_ids UUID[]
) AS $$
DECLARE
  v_item RECORD;
  v_variant_id UUID;
  v_quantity INT;
  v_current_stock INT;
  v_new_stock INT;
  v_product_id UUID;
  v_reduced_count INT := 0;
  v_affected_products UUID[] := ARRAY[]::UUID[];
  v_error_message TEXT := '';
BEGIN
  -- Start transaction (implicit in function)

  -- Check if order exists
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RETURN QUERY SELECT false, 'Order not found', 0, ARRAY[]::UUID[];
    RETURN;
  END IF;

  -- Loop through each item in the order
  FOR v_item IN
    SELECT oi.variant_id, oi.quantity, oi.product_id
    FROM order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    v_variant_id := v_item.variant_id;
    v_quantity := v_item.quantity;
    v_product_id := v_item.product_id;

    IF v_variant_id IS NULL THEN
      CONTINUE;
    END IF;

    BEGIN
      -- Get current stock with row lock to prevent concurrent updates
      SELECT stock_quantity INTO v_current_stock
      FROM product_variants
      WHERE id = v_variant_id
      FOR UPDATE;  -- Lock the row until transaction ends

      -- Check if sufficient stock
      IF v_current_stock < v_quantity THEN
        v_error_message := format('Insufficient stock for variant %s. Available: %s, Required: %s',
          v_variant_id, v_current_stock, v_quantity);
        RAISE EXCEPTION '%', v_error_message;
      END IF;

      -- Calculate new stock
      v_new_stock := v_current_stock - v_quantity;

      -- Update variant stock
      UPDATE product_variants
      SET stock_quantity = v_new_stock,
          updated_at = NOW()
      WHERE id = v_variant_id;

      v_reduced_count := v_reduced_count + 1;

      -- Add product to affected list (only once)
      IF NOT v_affected_products @> ARRAY[v_product_id] THEN
        v_affected_products := array_append(v_affected_products, v_product_id);
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_error_message := SQLERRM;
      RETURN QUERY SELECT false, v_error_message, v_reduced_count, v_affected_products;
      RETURN;
    END;
  END LOOP;

  -- Update product total_stock for all affected products
  FOR v_product_id IN SELECT DISTINCT unnest(v_affected_products)
  LOOP
    BEGIN
      UPDATE products
      SET total_stock = (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM product_variants
        WHERE product_id = v_product_id
      ),
      updated_at = NOW()
      WHERE id = v_product_id;

    EXCEPTION WHEN OTHERS THEN
      v_error_message := format('Error updating product totals: %s', SQLERRM);
      RETURN QUERY SELECT false, v_error_message, v_reduced_count, v_affected_products;
      RETURN;
    END;
  END LOOP;

  -- Mark products as out of stock if needed
  FOR v_product_id IN SELECT DISTINCT unnest(v_affected_products)
  LOOP
    BEGIN
      UPDATE products
      SET is_active = CASE
        WHEN total_stock = 0 THEN false
        ELSE true
      END,
      updated_at = NOW()
      WHERE id = v_product_id;

    EXCEPTION WHEN OTHERS THEN
      v_error_message := format('Error marking out of stock: %s', SQLERRM);
      RETURN QUERY SELECT false, v_error_message, v_reduced_count, v_affected_products;
      RETURN;
    END;
  END LOOP;

  -- Return success
  RETURN QUERY SELECT true, 'Stock reduced successfully', v_reduced_count, v_affected_products;

EXCEPTION WHEN OTHERS THEN
  v_error_message := SQLERRM;
  RETURN QUERY SELECT false, v_error_message, v_reduced_count, v_affected_products;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the function
COMMENT ON FUNCTION reduce_order_stock(UUID) IS
'Atomically reduces stock for all items in an order using a single transaction.
Prevents race conditions with multi-item orders. Locks rows to ensure consistency.
Returns: (success, message, reduced_items, product_ids)';

-- Create index for faster order item lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
