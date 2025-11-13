// Test cancelled email with available stock
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

    // Get a product with stock
    console.log('\n📦 Fetching products with stock...');
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
    console.log(`   Variant: ${variant.color} - ${variant.size}`);
    console.log(`   Available stock: ${variant.stock_quantity}`);

    // Create order to cancel
    const customerEmail = `cancel-${Date.now()}@test.com`;
    console.log('\n📝 Creating order to cancel...');
    const orderData = {
      shipping_first_name: 'Cancel',
      shipping_last_name: 'Test',
      shipping_email: customerEmail,
      shipping_phone: '9876543210',
      shipping_address: '456 Test Street',
      shipping_city: 'Test City',
      shipping_state: 'TS',
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

    const orderId = orderCreateData.data.id;
    const orderNumber = orderCreateData.data.order_number;
    console.log(`✅ Order created: ${orderNumber}`);
    console.log(`   📧 To be sent to: ${customerEmail}`);

    // Cancel the order
    console.log('\n❌ Cancelling order...');
    const cancelResponse = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    const cancelData = await cancelResponse.json();
    if (!cancelResponse.ok) {
      console.log('❌ Failed to cancel order:');
      console.log(JSON.stringify(cancelData, null, 2));
      return;
    }

    console.log(`✅ Order cancelled: ${orderNumber}`);
    console.log(`\n📧 CANCELLED EMAIL SHOULD BE SENT:`);
    console.log(`   Subject: Your Order #${orderNumber} Has Been Cancelled`);
    console.log(`   To: ${customerEmail}`);
    console.log(`   Contains: Cancellation confirmation and refund information`);

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ CANCELLED ORDER EMAIL TEST COMPLETED!\n');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testCancelledEmail();
