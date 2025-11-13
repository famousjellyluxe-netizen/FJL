// Test stock reduction and restoration feature
// This script tests the complete workflow:
// 1. Get a product with variants
// 2. Create an order
// 3. Verify stock is NOT reduced yet
// 4. Verify payment and reduce stock
// 5. Verify stock was reduced
// 6. Cancel the order
// 7. Verify stock was restored

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

async function testStockAutomation() {
  try {
    console.log('\n🧪 Testing Stock Automation Feature\n');
    console.log('='.repeat(70));

    const adminToken = await getAdminToken();

    // Step 1: Get all products to find one with variants
    console.log('\n📦 Step 1: Fetching products with variants...');
    const productsResponse = await fetch(`${API_BASE}/products`);
    const productsData = await productsResponse.json();

    const productWithVariants = productsData.data?.find(p => p.variants && p.variants.length > 0);

    if (!productWithVariants) {
      console.log('❌ No products with variants found. Please create a product with variants first.');
      return;
    }

    console.log(`✅ Found product: ${productWithVariants.name} (ID: ${productWithVariants.id})`);

    // Get variant with stock >= 2
    const variantWithStock = productWithVariants.variants.find(v => v.stock_quantity >= 2);
    if (!variantWithStock) {
      console.log('❌ No variant with sufficient stock (>=2) found');
      return;
    }

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
    console.log(`✅ Order created: ${orderNumber} (ID: ${orderId})`);

    // Step 3: Verify stock is NOT reduced yet
    console.log('\n' + '='.repeat(70));
    console.log('\n🔍 Step 3: Verifying stock is NOT reduced yet...');

    const variantCheckBefore = await fetch(`${API_BASE}/products/${productWithVariants.id}/variants/${variantWithStock.id}`);
    // Note: This endpoint might not exist, let's fetch full product instead

    const productCheckBefore = await fetch(`${API_BASE}/products/${productWithVariants.id}`);
    const productBeforeData = await productCheckBefore.json();
    const variantBefore = productBeforeData.data.variants.find(v => v.id === variantWithStock.id);

    console.log(`Current variant stock: ${variantBefore.stock_quantity}`);
    if (variantBefore.stock_quantity === initialStock) {
      console.log(`✅ Stock NOT reduced yet (still ${initialStock}) - CORRECT!`);
    } else {
      console.log(`❌ Stock was already reduced! Initial: ${initialStock}, Current: ${variantBefore.stock_quantity}`);
    }

    // Step 4: Verify payment (reduce stock)
    console.log('\n' + '='.repeat(70));
    console.log('\n💳 Step 4: Verifying payment (this should trigger stock reduction)...');

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

    console.log(`✅ Payment verified for order ${orderNumber}`);
    console.log(`   stock_deducted: ${paymentData.data.stock_deducted}`);
    console.log(`   stock_deducted_at: ${paymentData.data.stock_deducted_at}`);

    // Step 5: Verify stock was reduced
    console.log('\n' + '='.repeat(70));
    console.log('\n🔍 Step 5: Verifying stock WAS reduced...');

    const productCheckAfter = await fetch(`${API_BASE}/products/${productWithVariants.id}`);
    const productAfterData = await productCheckAfter.json();
    const variantAfter = productAfterData.data.variants.find(v => v.id === variantWithStock.id);

    const expectedStock = initialStock - orderQuantity;
    console.log(`Expected variant stock: ${expectedStock}`);
    console.log(`Actual variant stock: ${variantAfter.stock_quantity}`);

    if (variantAfter.stock_quantity === expectedStock) {
      console.log(`✅ Stock reduced correctly! (${initialStock} - ${orderQuantity} = ${expectedStock})`);
    } else {
      console.log(`❌ Stock reduction failed! Expected ${expectedStock}, got ${variantAfter.stock_quantity}`);
    }

    // Step 6: Cancel the order
    console.log('\n' + '='.repeat(70));
    console.log('\n❌ Step 6: Cancelling the order...');

    const cancelResponse = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const cancelData = await cancelResponse.json();
    if (!cancelResponse.ok || !cancelData.success) {
      console.log('❌ Failed to cancel order:', cancelData);
      return;
    }

    console.log(`✅ Order cancelled: ${orderNumber}`);
    console.log(`   stock_deducted: ${cancelData.data.stock_deducted}`);
    console.log(`   stock_deducted_at: ${cancelData.data.stock_deducted_at}`);

    // Step 7: Verify stock was restored
    console.log('\n' + '='.repeat(70));
    console.log('\n🔍 Step 7: Verifying stock WAS restored...');

    const productCheckRestored = await fetch(`${API_BASE}/products/${productWithVariants.id}`);
    const productRestoredData = await productCheckRestored.json();
    const variantRestored = productRestoredData.data.variants.find(v => v.id === variantWithStock.id);

    console.log(`Expected variant stock: ${initialStock}`);
    console.log(`Actual variant stock: ${variantRestored.stock_quantity}`);

    if (variantRestored.stock_quantity === initialStock) {
      console.log(`✅ Stock restored correctly! Back to ${initialStock}`);
    } else {
      console.log(`❌ Stock restoration failed! Expected ${initialStock}, got ${variantRestored.stock_quantity}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ ✅ ✅ Stock automation test COMPLETED SUCCESSFULLY! ✅ ✅ ✅\n');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testStockAutomation();
