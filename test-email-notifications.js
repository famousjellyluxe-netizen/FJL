// Test email notifications for order status changes
const API_BASE = 'http://localhost:5001/api';

async function getAdminToken() {
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@fjl.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (loginResponse.ok && loginData.success) {
      return loginData.data.token;
    }
    throw new Error('Login failed');
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
}

async function testEmailNotifications() {
  try {
    console.log('\n🧪 Testing Email Notifications for Order Status Changes\n');
    console.log('='.repeat(70));

    const adminToken = await getAdminToken();
    console.log('✅ Logged in as admin');

    // Get a product with variants
    console.log('\n📦 Fetching products...');
    const productsResponse = await fetch(`${API_BASE}/products`);
    const productsData = await productsResponse.json();

    const product = productsData.data?.find(p => p.variants && p.variants.length > 0);
    if (!product) {
      console.log('❌ No products found');
      return;
    }

    const variant = product.variants.find(v => v.stock_quantity >= 2);
    if (!variant) {
      console.log('❌ No variant with 2+ stock');
      return;
    }

    console.log(`✅ Using ${product.name} - ${variant.color} ${variant.size}`);

    // Create order
    console.log('\n📝 Creating test order...');
    const orderData = {
      shipping_first_name: 'Test',
      shipping_last_name: 'Customer',
      shipping_email: `test-${Date.now()}@test.com`,
      shipping_phone: '1234567890',
      shipping_address: '123 Test Street',
      shipping_city: 'Test City',
      shipping_state: 'Test State',
      shipping_postal_code: '12345',
      shipping_country: 'Test Country',
      buyer_name: 'Test Customer',
      payment_method: 'bank_transfer',
      subtotal: product.price * 2,
      tax: 0,
      shipping_cost: 0,
      total_amount: product.price * 2,
      items: [
        {
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          product_sku: product.sku,
          size: variant.size,
          color: variant.color,
          unit_price: product.price,
          quantity: 2,
          total_price: product.price * 2
        }
      ]
    };

    const orderResponse = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const orderCreateData = await orderResponse.json();
    if (!orderResponse.ok) {
      console.log('❌ Failed to create order:', orderCreateData);
      return;
    }

    const orderId = orderCreateData.data.id;
    const orderNumber = orderCreateData.data.order_number;
    console.log(`✅ Order created: ${orderNumber}`);
    console.log(`   Customer email: ${orderData.shipping_email}`);

    // Test 1: Verify payment (stock should be deducted)
    console.log('\n💳 TEST 1: Verifying payment...');
    const paymentResponse = await fetch(`${API_BASE}/orders/${orderId}/payment-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        payment_status: 'verified'
      })
    });

    const paymentData = await paymentResponse.json();
    if (!paymentResponse.ok) {
      console.log('❌ Failed to verify payment');
      return;
    }
    console.log(`✅ Payment verified (stock deducted)`);
    console.log('   Check email: Payment verification notification should be sent');

    // Test 2: Update status to shipped (should trigger email)
    console.log('\n🚚 TEST 2: Updating order status to SHIPPED...');
    const shippedResponse = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'shipped'
      })
    });

    const shippedData = await shippedResponse.json();
    if (!shippedResponse.ok) {
      console.log('❌ Failed to update status to shipped');
      return;
    }
    console.log(`✅ Order status updated to SHIPPED`);
    console.log(`   📧 Email should be sent: "Your Order #${orderNumber} Has Shipped! 🚚"`);
    console.log(`   📬 To: ${orderData.shipping_email}`);

    // Wait a bit before next status update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Update status to delivered (should trigger email)
    console.log('\n📦 TEST 3: Updating order status to DELIVERED...');
    const deliveredResponse = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'delivered'
      })
    });

    const deliveredData = await deliveredResponse.json();
    if (!deliveredResponse.ok) {
      console.log('❌ Failed to update status to delivered');
      return;
    }
    console.log(`✅ Order status updated to DELIVERED`);
    console.log(`   📧 Email should be sent: "Your Order #${orderNumber} Has Been Delivered! 📦"`);
    console.log(`   📬 To: ${orderData.shipping_email}`);

    // Create another order to test cancellation
    console.log('\n📝 Creating second order to test cancellation...');
    const cancelOrderData = {
      shipping_first_name: 'Cancel',
      shipping_last_name: 'Test',
      shipping_email: `cancel-${Date.now()}@test.com`,
      shipping_phone: '9876543210',
      shipping_address: '456 Cancel Ave',
      shipping_city: 'Cancel City',
      shipping_state: 'Cancel State',
      shipping_postal_code: '54321',
      shipping_country: 'Cancel Country',
      buyer_name: 'Cancel Test',
      payment_method: 'bank_transfer',
      subtotal: product.price,
      tax: 0,
      shipping_cost: 0,
      total_amount: product.price,
      items: [
        {
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          product_sku: product.sku,
          size: variant.size,
          color: variant.color,
          unit_price: product.price,
          quantity: 1,
          total_price: product.price
        }
      ]
    };

    const cancelOrderResponse = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cancelOrderData)
    });

    const cancelOrderCreateData = await cancelOrderResponse.json();
    if (!cancelOrderResponse.ok) {
      console.log('❌ Failed to create cancellation test order');
      return;
    }

    const cancelOrderId = cancelOrderCreateData.data.id;
    const cancelOrderNumber = cancelOrderCreateData.data.order_number;
    console.log(`✅ Order created: ${cancelOrderNumber}`);
    console.log(`   Customer email: ${cancelOrderData.shipping_email}`);

    // Test 4: Update status to cancelled (should trigger email)
    console.log('\n❌ TEST 4: Updating order status to CANCELLED...');
    const cancelledResponse = await fetch(`${API_BASE}/orders/${cancelOrderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    const cancelledData = await cancelledResponse.json();
    if (!cancelledResponse.ok) {
      console.log('❌ Failed to update status to cancelled');
      return;
    }
    console.log(`✅ Order status updated to CANCELLED`);
    console.log(`   📧 Email should be sent: "Your Order #${cancelOrderNumber} Has Been Cancelled"`);
    console.log(`   📬 To: ${cancelOrderData.shipping_email}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ ✅ ✅ EMAIL NOTIFICATION TESTS COMPLETED! ✅ ✅ ✅');
    console.log('\n📧 Summary:');
    console.log('   1. SHIPPED email: Sent to order 1');
    console.log('   2. DELIVERED email: Sent to order 1');
    console.log('   3. CANCELLED email: Sent to order 2');
    console.log('\n💡 Check the Resend API dashboard or email logs to verify emails were sent\n');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testEmailNotifications();
