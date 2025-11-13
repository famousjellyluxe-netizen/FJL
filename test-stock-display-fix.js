// Comprehensive test for stock display fix
// This tests that product total_stock is updated after payment verification

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

async function testStockDisplayFix() {
  try {
    console.log('\n🧪 Testing Stock Display Fix (total_stock recalculation)\n');
    console.log('='.repeat(70));

    const adminToken = await getAdminToken();
    console.log('✅ Logged in as admin');

    // Get a product
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

    console.log(`✅ Using ${product.name}`);
    console.log(`   Variant: ${variant.color} - ${variant.size}`);

    const initialProductTotal = product.total_stock;
    const initialVariantStock = variant.stock_quantity;

    console.log(`\n📊 BEFORE ORDER:`);
    console.log(`   Product total_stock: ${initialProductTotal}`);
    console.log(`   Variant stock: ${initialVariantStock}`);

    // Calculate expected variant sum
    let variantSum = 0;
    product.variants.forEach(v => {
      variantSum += v.stock_quantity;
    });
    console.log(`   Sum of all variants: ${variantSum}`);

    if (initialProductTotal === variantSum) {
      console.log(`   ✅ Total stock matches variant sum`);
    } else {
      console.log(`   ⚠️ Total stock does NOT match variant sum`);
    }

    // Create order
    console.log('\n📝 Creating and verifying order...');
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
      console.log('❌ Failed to create order');
      return;
    }

    const orderId = orderCreateData.data.id;
    console.log(`✅ Order created: ${orderCreateData.data.order_number}`);

    // Verify payment
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

    // Check stock AFTER payment
    console.log('\n📦 Fetching updated product...');
    const productCheckResponse = await fetch(`${API_BASE}/products/${product.id}`);
    const updatedProductData = await productCheckResponse.json();
    const updatedProduct = updatedProductData.data;

    console.log(`\n📊 AFTER PAYMENT VERIFICATION:`);
    console.log(`   Product total_stock: ${updatedProduct.total_stock}`);

    // Calculate new variant sum
    let newVariantSum = 0;
    updatedProduct.variants.forEach(v => {
      newVariantSum += v.stock_quantity;
    });
    console.log(`   Sum of all variants: ${newVariantSum}`);

    const expectedProductTotal = initialProductTotal - 2;
    console.log(`   Expected total_stock: ${expectedProductTotal}`);

    console.log('\n🔍 VALIDATION:');
    if (updatedProduct.total_stock === expectedProductTotal) {
      console.log(`   ✅ Product total_stock reduced correctly!`);
    } else {
      console.log(`   ❌ Product total_stock NOT reduced correctly!`);
      console.log(`      Got: ${updatedProduct.total_stock}, Expected: ${expectedProductTotal}`);
    }

    if (updatedProduct.total_stock === newVariantSum) {
      console.log(`   ✅ Product total_stock matches variant sum!`);
    } else {
      console.log(`   ❌ Product total_stock DOES NOT match variant sum!`);
      console.log(`      Product total: ${updatedProduct.total_stock}, Variant sum: ${newVariantSum}`);
    }

    console.log('\n' + '='.repeat(70));

    if (updatedProduct.total_stock === expectedProductTotal && updatedProduct.total_stock === newVariantSum) {
      console.log('\n✅ ✅ ✅ STOCK DISPLAY FIX WORKING CORRECTLY! ✅ ✅ ✅\n');
    } else {
      console.log('\n❌ ❌ ❌ STOCK DISPLAY FIX NOT WORKING! ❌ ❌ ❌\n');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testStockDisplayFix();
