-- Migration: Create stored procedure for atomic stock reduction
-- Date: November 2025
-- Description: Creates a PL/pgSQL function that atomically reduces stock
--              for all items in an order, preventing race conditions

CREATE OR REPLACE FUNCTION reduce_order_stock(p_order_id uuid)
RETURNS TABLE (
  success boolean,
  reduced_items integer,
  product_ids uuid[],
  message text
) AS $$
DECLARE
  v_reduced_count integer := 0;
  v_product_list uuid[];
  v_order_exists boolean;
  v_order_record record;
  v_item record;
BEGIN
  -- Check if order exists
  SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id)
  INTO v_order_exists;

  IF NOT v_order_exists THEN
    RETURN QUERY SELECT false, 0, ARRAY[]::uuid[], 'Order not found'::text;
    RETURN;
  END IF;

  -- Start transaction for atomic operation
  BEGIN
    -- Get order details
    SELECT * INTO v_order_record FROM orders WHERE id = p_order_id;

    -- If stock already deducted, don't do it again
    IF v_order_record.stock_deducted THEN
      RETURN QUERY SELECT true, 0, ARRAY[]::uuid[], 'Stock already deducted for this order'::text;
      RETURN;
    END IF;

    -- Lock and update all variants for this order atomically
    FOR v_item IN (
      SELECT DISTINCT oi.variant_id, SUM(oi.quantity) as total_qty, oi.product_id
      FROM order_items oi
      WHERE oi.order_id = p_order_id
      GROUP BY oi.variant_id, oi.product_id
    ) LOOP
      -- Lock the variant row and check stock
      PERFORM 1 FROM product_variants
      WHERE id = v_item.variant_id
      FOR UPDATE;

      -- Verify sufficient stock exists (should pass since we validated at order creation)
      IF (
        SELECT stock_quantity FROM product_variants WHERE id = v_item.variant_id
      ) < v_item.total_qty THEN
        RAISE EXCEPTION 'Insufficient stock for variant %', v_item.variant_id;
      END IF;

      -- Reduce stock
      UPDATE product_variants
      SET stock_quantity = stock_quantity - v_item.total_qty
      WHERE id = v_item.variant_id;

      v_reduced_count := v_reduced_count + 1;
      v_product_list := array_append(v_product_list, v_item.product_id);
    END LOOP;

    -- Update product total_stock for affected products (denormalized field)
    UPDATE products
    SET total_stock = (
      SELECT COALESCE(SUM(stock_quantity), 0)
      FROM product_variants
      WHERE product_id = products.id
    )
    WHERE id = ANY(v_product_list);

    -- All operations succeeded
    RETURN QUERY SELECT true, v_reduced_count, v_product_list, 'Stock reduced successfully'::text;
    RETURN;

  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically on exception
    RETURN QUERY SELECT false, 0, ARRAY[]::uuid[], ('Error reducing stock: ' || SQLERRM)::text;
    RETURN;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reduce_order_stock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reduce_order_stock(uuid) TO service_role;
