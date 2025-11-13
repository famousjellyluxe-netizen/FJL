// Test order cancellation via status dropdown (PUT /api/orders/:id/status)
// This verifies that stock is restored AND stock_deducted flag is reset to FALSE

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
      console.log('✅ Logged in as admin');
      return loginData.data.token;
    } else {
      console.log('❌ Login failed');
      throw new Error('Failed to login');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

async function testCancellationViaStatus() {
  try {
    console.log('\n🧪 Testing Order Cancellation via Status Dropdown\n');
    console.log('='.repeat(70));

    const adminToken = await getAdminToken();

    // Step 1: Get products with variants
    console.log('\n📦 Step 1: Fetching products with variants...');
    const productsResponse = await fetch(`${API_BASE}/products`);
    const productsData = await productsResponse.json();

    const productWithVariants = productsData.data?.find(p => p.variants && p.variants.length > 0);

    if (!productWithVariants) {
      console.log('❌ No products with variants found.');
      return;
    }

    const variantWithStock = productWithVariants.variants.find(v => v.stock_quantity >= 2);
    if (!variantWithStock) {
      console.log('❌ No variant with sufficient stock (>=2) found');
      return;
    }

    console.log(`✅ Using product: ${productWithVariants.name}`);
    console.log(`✅ Using variant: ${variantWithStock.color} - ${variantWithStock.size} (Stock: ${variantWithStock.stock_quantity})`);

    const initialStock = variantWithStock.stock_quantity;
    const orderQuantity = 2;

    console.log('\n' + '='.repeat(70));

    // Step 2: Create an order
    console.log('\n📝 Step 2: Creating an order...');
    const orderData = {
      shipping_first_name: 'Test',
      shipping_last_name: 'Customer',
      shipping_email: `test-${Date.now()}@example.com`,
      shipping_phone: '1234567890',
      shipping_address: '123 Test St',
      shipping_city: 'Test City',
      shipping_state: 'Test State',
      shipping_postal_code: '12345',
      shipping_country: 'Test Country',
      buyer_name: 'Test Customer',
      payment_method: 'bank_transfer',
      subtotal: productWithVariants.price * orderQuantity,
      tax: 0,
      shipping_cost: 0,
      total_amount: productWithVariants.price * orderQuantity,
      items: [
        {
          product_id: productWithVariants.id,
          variant_id: variantWithStock.id,
          product_name: productWithVariants.name,
          product_sku: productWithVariants.sku,
          size: variantWithStock.size,
          color: variantWithStock.color,
          unit_price: productWithVariants.price,
          quantity: orderQuantity,
          total_price: productWithVariants.price * orderQuantity
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
    if (!orderResponse.ok || !orderCreateData.success) {
      console.log('❌ Failed to create order:', orderCreateData);
      return;
    }

    const orderId = orderCreateData.data.id;
    const orderNumber = orderCreateData.data.order_number;
    console.log(`✅ Order created: ${orderNumber}`);

    console.log('\n' + '='.repeat(70));

    // Step 3: Verify payment
    console.log('\n💳 Step 3: Verifying payment (reducing stock)...');
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
    if (!paymentResponse.ok || !paymentData.success) {
      console.log('❌ Failed to verify payment:', paymentData);
      return;
    }

    console.log(`✅ Payment verified`);
    console.log(`   stock_deducted: ${paymentData.data.stock_deducted}`);

    // Verify stock was reduced
    let productCheck = await fetch(`${API_BASE}/products/${productWithVariants.id}`);
    let productCheckData = await productCheck.json();
    let variantCheck = productCheckData.data.variants.find(v => v.id === variantWithStock.id);
    console.log(`   variant stock after payment: ${variantCheck.stock_quantity}`);

    console.log('\n' + '='.repeat(70));

    // Step 4: Cancel via status dropdown (PUT /api/orders/:id/status)
    console.log('\n❌ Step 4: Cancelling via status dropdown (like admin does)...');
    const statusUpdateResponse = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    const statusUpdateData = await statusUpdateResponse.json();
    if (!statusUpdateResponse.ok || !statusUpdateData.success) {
      console.log('❌ Failed to cancel order via status:', statusUpdateData);
      return;
    }

    console.log(`✅ Order cancelled via status dropdown`);
    console.log(`   order_status: ${statusUpdateData.data.order_status}`);
    console.log(`   stock_deducted: ${statusUpdateData.data.stock_deducted}`);
    console.log(`   stock_deducted_at: ${statusUpdateData.data.stock_deducted_at}`);

    console.log('\n' + '='.repeat(70));

    // Step 5: Verify stock was restored
    console.log('\n🔍 Step 5: Verifying stock WAS restored...');
    productCheck = await fetch(`${API_BASE}/products/${productWithVariants.id}`);
    productCheckData = await productCheck.json();
    variantCheck = productCheckData.data.variants.find(v => v.id === variantWithStock.id);

    console.log(`Expected variant stock: ${initialStock}`);
    console.log(`Actual variant stock: ${variantCheck.stock_quantity}`);

    if (variantCheck.stock_quantity === initialStock) {
      console.log(`✅ Stock restored correctly!`);
    } else {
      console.log(`❌ Stock restoration failed!`);
    }

    // Step 6: Verify flags were reset
    console.log('\n🔍 Step 6: Verifying stock_deducted flags were reset...');
    if (statusUpdateData.data.stock_deducted === false) {
      console.log(`✅ stock_deducted is FALSE - CORRECT!`);
    } else {
      console.log(`❌ stock_deducted is still ${statusUpdateData.data.stock_deducted} - WRONG!`);
    }

    if (statusUpdateData.data.stock_deducted_at === null) {
      console.log(`✅ stock_deducted_at is NULL - CORRECT!`);
    } else {
      console.log(`❌ stock_deducted_at is still ${statusUpdateData.data.stock_deducted_at} - WRONG!`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ ✅ ✅ Cancellation via Status Test COMPLETED! ✅ ✅ ✅\n');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testCancellationViaStatus();
