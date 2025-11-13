// Test multi-item order with payment verification
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
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

async function testMultiItemOrder() {
  try {
    console.log('🧪 Testing Multi-Item Order with Payment Verification\n');

    const token = await getAdminToken();
    console.log('✅ Logged in successfully\n');

    // Step 1: Get available products
    console.log('📝 Step 1: Fetching available products...');
    const productsResponse = await fetch(`${API_BASE}/products?limit=100`);
    const productsData = await productsResponse.json();

    if (!productsData.success || productsData.data.length < 2) {
      console.log('❌ Not enough products available. Creating test products...');
      return;
    }

    const products = productsData.data.slice(0, 2); // Get first 2 products
    console.log(`✅ Found ${products.length} products to test with\n`);

    // Step 2: Create an order with multiple items
    console.log('📝 Step 2: Creating multi-item order...');
    const orderPayload = {
      buyer_name: 'Test Customer',
      shipping_first_name: 'Test',
      shipping_last_name: 'Customer',
      shipping_email: 'test@example.com',
      shipping_phone: '+1234567890',
      shipping_address: '123 Test Street Suite 100',
      shipping_city: 'Test City',
      shipping_state: 'Test State',
      shipping_postal_code: '12345',
      shipping_country: 'Test Country',
      items: products.map((product, index) => ({
        product_id: product.id,
        quantity: 2 + index, // 2 for first product, 3 for second
        variant_id: product.variants && product.variants.length > 0
          ? product.variants[0].id
          : null,
        size: product.variants && product.variants.length > 0
          ? product.variants[0].size
          : 'M',
        color: product.variants && product.variants.length > 0
          ? product.variants[0].color
          : 'Black'
      }))
    };

    const createOrderResponse = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await createOrderResponse.json();

    if (!createOrderResponse.ok || !orderData.success) {
      console.log('❌ Failed to create order');
      console.log('Error:', orderData);
      return;
    }

    const orderId = orderData.data.id;
    console.log(`✅ Order created successfully!`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Order Items: ${orderData.data.items.length}`);
    console.log(`Total Amount: ${orderData.data.total_amount}\n`);

    // Step 3: Get initial stock levels
    console.log('📝 Step 3: Checking initial stock levels...');
    let initialStockLevels = [];
    for (const product of products) {
      const productResponse = await fetch(`${API_BASE}/products/${product.id}`);
      const productDetail = await productResponse.json();
      if (productDetail.success) {
        initialStockLevels.push({
          productId: product.id,
          productName: product.name,
          totalStock: productDetail.data.total_stock,
          variants: productDetail.data.variants
        });
        console.log(`  - ${product.name}: ${productDetail.data.total_stock} units`);
      }
    }
    console.log();

    // Step 4: Verify payment status
    console.log('📝 Step 4: Verifying payment status...');
    const verifyPaymentResponse = await fetch(`${API_BASE}/orders/${orderId}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        payment_status: 'verified'
      })
    });

    const verifyData = await verifyPaymentResponse.json();

    if (!verifyPaymentResponse.ok || !verifyData.success) {
      console.log('❌ Failed to verify payment');
      console.log('Error:', verifyData);
      return;
    }

    console.log('✅ Payment verified successfully!\n');

    // Step 5: Check final stock levels
    console.log('📝 Step 5: Checking final stock levels after order...');
    let finalStockLevels = [];
    let totalDeducted = 0;
    let expectedDeduction = 0;

    for (const item of orderPayload.items) {
      expectedDeduction += item.quantity;
    }

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productResponse = await fetch(`${API_BASE}/products/${product.id}`);
      const productDetail = await productResponse.json();

      if (productDetail.success) {
        const initial = initialStockLevels[i].totalStock;
        const final = productDetail.data.total_stock;
        const deducted = initial - final;
        totalDeducted += deducted;

        finalStockLevels.push({
          productId: product.id,
          productName: product.name,
          initialStock: initial,
          finalStock: final,
          deducted: deducted
        });

        console.log(`  - ${product.name}:`);
        console.log(`    Initial: ${initial} → Final: ${final} (Deducted: ${deducted})`);
      }
    }
    console.log();

    // Step 6: Verify stock deduction
    console.log('📝 Step 6: Verifying stock deduction...');
    if (totalDeducted === expectedDeduction) {
      console.log('✅ Stock deduction verified!');
      console.log(`   Expected deduction: ${expectedDeduction} units`);
      console.log(`   Actual deduction: ${totalDeducted} units`);
      console.log(`   ✅ MATCH - No race condition detected!\n`);
    } else {
      console.log('❌ Stock deduction mismatch!');
      console.log(`   Expected deduction: ${expectedDeduction} units`);
      console.log(`   Actual deduction: ${totalDeducted} units`);
      console.log(`   ⚠️  MISMATCH - Possible race condition!\n`);
    }

    console.log('=' .repeat(60));
    console.log('✅ Multi-Item Order Test Completed Successfully!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('Test error:', error);
  }
}

testMultiItemOrder();
