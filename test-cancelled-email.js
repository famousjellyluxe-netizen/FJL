// Simple test for cancelled order email
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

async function testCancelledEmail() {
  try {
    console.log('\n🧪 Testing Cancelled Order Email\n');
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

    const variant = product.variants[0]; // Just use first variant

    console.log(`✅ Using ${product.name}`);

    // Create order
    console.log('\n📝 Creating test order to cancel...');
    const orderData = {
      shipping_first_name: 'Cancel',
      shipping_last_name: 'Test',
      shipping_email: `cancel-${Date.now()}@test.com`,
      shipping_phone: '9876543210',
      shipping_address: '456 Cancel Ave',
      shipping_city: 'Cancel City',
      shipping_state: 'CS',
      shipping_postal_code: '54321',
      shipping_country: 'Nigeria',
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

    const orderResponse = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const orderCreateData = await orderResponse.json();
    if (!orderResponse.ok) {
      console.log('❌ Failed to create order:');
      console.log(JSON.stringify(orderCreateData, null, 2));
      return;
    }

    const cancelOrderId = orderCreateData.data.id;
    const cancelOrderNumber = orderCreateData.data.order_number;
    console.log(`✅ Order created: ${cancelOrderNumber}`);
    console.log(`   Customer email: ${orderData.shipping_email}`);

    // Update status to cancelled (should trigger email)
    console.log('\n❌ Updating order status to CANCELLED...');
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
      console.log(JSON.stringify(cancelledData, null, 2));
      return;
    }
    console.log(`✅ Order status updated to CANCELLED`);
    console.log(`   📧 Email should be sent: "Your Order #${cancelOrderNumber} Has Been Cancelled"`);
    console.log(`   📬 To: ${orderData.shipping_email}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ CANCELLED EMAIL TEST COMPLETED!\n');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testCancelledEmail();
