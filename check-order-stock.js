// Check order details and product stock
const orderId = 'e5440e7f-6385-4879-99d8-51c4c4ab6865';

async function checkOrderAndStock() {
  try {
    // Get order details
    const orderResponse = await fetch(`http://localhost:5001/api/orders/${orderId}`);
    const orderData = await orderResponse.json();

    if (!orderData.success) {
      console.log('Failed to fetch order:', orderData);
      return;
    }

    const order = orderData.data;
    console.log('📋 Order Details:');
    console.log('  Order Number:', order.order_number);
    console.log('  Payment Status:', order.payment_status);
    console.log('  Stock Deducted:', order.stock_deducted);
    console.log('  Stock Deducted At:', order.stock_deducted_at);

    console.log('\n📦 Order Items:');
    const items = order.order_items || order.items || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n  Item ${i + 1}:`);
      console.log(`    Product ID: ${item.product_id}`);
      console.log(`    Variant ID: ${item.variant_id}`);
      console.log(`    Product Name: ${item.product_name}`);
      console.log(`    Size: ${item.size}, Color: ${item.color}`);
      console.log(`    Quantity Ordered: ${item.quantity}`);

      // Get product details to check current stock
      const productResponse = await fetch(`http://localhost:5001/api/products/${item.product_id}`);
      const productData = await productResponse.json();

      if (productData.success && productData.data.variants) {
        const variant = productData.data.variants.find(v => v.id === item.variant_id);
        if (variant) {
          console.log(`    Current Variant Stock: ${variant.stock_quantity}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOrderAndStock();
