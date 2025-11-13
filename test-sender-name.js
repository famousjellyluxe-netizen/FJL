// Test script to verify email sender display name
// This verifies that the "from" field is correctly formatted with display name

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

async function testSenderName() {
  try {
    console.log('\n🧪 Testing Email Sender Display Name\n');
    console.log('='.repeat(70));

    const adminToken = await getAdminToken();
    console.log('✅ Logged in as admin');

    // Get a product with variants
    console.log('\n📦 Fetching products...');
    const productsResponse = await fetch(`${API_BASE}/products`);
    const productsData = await productsResponse.json();

    const product = productsData.data?.find(p =>
      p.variants && p.variants.some(v => v.stock_quantity > 0)
    );

    if (!product) {
      console.log('❌ No products with stock found');
      return;
    }

    const variant = product.variants.find(v => v.stock_quantity > 0);
    console.log(`✅ Using ${product.name}`);

    // Create test order
    const testEmail = `sender-test-${Date.now()}@test.com`;
    console.log('\n📝 Creating test order to trigger email...');
    const orderData = {
      shipping_first_name: 'Sender',
      shipping_last_name: 'Test',
      shipping_email: testEmail,
      shipping_phone: '1234567890',
      shipping_address: '123 Test Street',
      shipping_city: 'Test City',
      shipping_state: 'TS',
      shipping_postal_code: '12345',
      shipping_country: 'Nigeria',
      buyer_name: 'Sender Test',
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
      console.log('❌ Failed to create order');
      console.log(JSON.stringify(orderCreateData, null, 2));
      return;
    }

    const orderId = orderCreateData.data.id;
    const orderNumber = orderCreateData.data.order_number;
    console.log(`✅ Order created: ${orderNumber}`);
    console.log(`   📧 Test email sent to: ${testEmail}`);

    // Verify payment to trigger another email
    console.log('\n💳 Verifying payment to trigger email...');
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
    console.log(`✅ Payment verified`);

    // Update to shipped status to trigger another email
    console.log('\n🚚 Updating to shipped to trigger email...');
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
      console.log('❌ Failed to update to shipped');
      return;
    }
    console.log(`✅ Status updated to shipped`);

    console.log('\n' + '='.repeat(70));
    console.log('\n📧 EMAIL SENDER NAME TEST COMPLETE!');
    console.log('\n✅ The following emails should be sent with sender:');
    console.log('   "Famous Jelly Luxe <hello@fjlclothing.shop>"');
    console.log('\n📬 Email recipients for verification:');
    console.log(`   - Order confirmation: ${testEmail}`);
    console.log(`   - Payment verified: ${testEmail}`);
    console.log(`   - Shipped notification: ${testEmail}`);
    console.log('\n💡 Check the Resend dashboard or received emails to verify:');
    console.log('   The "From" header should show "Famous Jelly Luxe" as sender name');
    console.log('   Not just "hello"\n');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testSenderName();
