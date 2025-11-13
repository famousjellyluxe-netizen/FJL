// Test payment verification via API to see stock reduction
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

async function testPaymentVerification() {
  try {
    console.log('\n🧪 Testing Payment Verification Stock Reduction\n');
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
    const initialStock = variant.stock_quantity;
    console.log(`   Initial stock: ${initialStock}`);

    // Create order
    console.log('\n📝 Creating order...');
    const orderData = {
      shipping_first_name: 'Test',
      shipping_last_name: 'User',
      shipping_email: `test-${Date.now()}@test.com`,
      shipping_phone: '1234567890',
      shipping_address: '123 St',
      shipping_city: 'City',
      shipping_state: 'State',
      shipping_postal_code: '12345',
      shipping_country: 'Country',
      buyer_name: 'Test User',
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
    console.log(`✅ Order created: ${orderCreateData.data.order_number}`);

    // Check stock before payment
    console.log('\n🔍 Stock BEFORE payment verification:');
    let productCheck = await fetch(`${API_BASE}/products/${product.id}`);
    let productCheckData = await productCheck.json();
    let variantCheck = productCheckData.data.variants.find(v => v.id === variant.id);
    console.log(`   Current stock: ${variantCheck.stock_quantity}`);
    console.log(`   Expected: ${initialStock} (no reduction yet)`);

    // Verify payment via API
    console.log('\n💳 Verifying payment via API...');
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
      console.log('❌ Failed to verify payment:', paymentData);
      return;
    }

    console.log(`✅ Payment verified via API`);
    console.log(`   stock_deducted: ${paymentData.data.stock_deducted}`);

    // Check stock after payment
    console.log('\n🔍 Stock AFTER payment verification:');
    productCheck = await fetch(`${API_BASE}/products/${product.id}`);
    productCheckData = await productCheck.json();
    variantCheck = productCheckData.data.variants.find(v => v.id === variant.id);
    console.log(`   Current stock: ${variantCheck.stock_quantity}`);
    console.log(`   Expected: ${initialStock - 2}`);

    if (variantCheck.stock_quantity === initialStock - 2) {
      console.log(`   ✅ Stock reduced correctly!`);
    } else {
      console.log(`   ❌ Stock NOT reduced correctly!`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('Test error:', error);
  }
}

testPaymentVerification();
