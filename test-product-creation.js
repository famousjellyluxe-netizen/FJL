// Test product creation with variant stock distribution
const API_BASE = 'http://localhost:5001/api';

async function getAdminToken() {
  try {
    // Try to login with test credentials
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
      console.log('✅ Logged in successfully');
      return loginData.data.token;
    } else {
      console.log('❌ Login failed:', loginData);
      // Try to register a new admin account
      console.log('📝 Attempting to register admin account...');

      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@fjl.com',
          password: 'admin123',
          name: 'Admin User'
        })
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok && registerData.success) {
        console.log('✅ Registered and logged in successfully');
        return registerData.data.token;
      } else {
        console.log('❌ Registration failed:', registerData);
        throw new Error('Failed to authenticate');
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

async function testProductCreation() {
  try {
    console.log('🧪 Testing Product Creation with Variant Stock Distribution\n');

    // Get authentication token
    const token = await getAdminToken();

    // Test 1: Verify auto-distribute mode is rejected
    console.log('📝 Test 1: Verifying AUTO-DISTRIBUTE mode is rejected...');
    const timestamp = Date.now();
    const autoDistributeProduct = {
      name: 'Test Auto-Distribute Product',
      sku: `TEST-AUTO-${timestamp}`,
      price: 9999,
      sleeve_type: 'sleeveless',
      total_stock: 20,
      available_sizes: ['S', 'M', 'L', 'XL'],
      available_colors: ['Black', 'White'],
      distribution_mode: 'equal',
      is_active: true
    };

    const response1 = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(autoDistributeProduct)
    });

    const data1 = await response1.json();

    if (!response1.ok && !data1.success) {
      console.log('✅ Auto-distribute mode correctly rejected!');
      console.log(`Error message: ${data1.error || data1.message}`);
    } else {
      console.log('❌ Auto-distribute mode should have been rejected!');
      console.log('Response:', data1);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Create product with manual distribution
    console.log('📝 Test 2: Creating product with MANUAL distribution mode...');
    const manualDistributeProduct = {
      name: 'Test Manual Distribution Product',
      sku: `TEST-MANUAL-${timestamp}`,
      price: 12999,
      sleeve_type: 'short-sleeve',
      total_stock: 25,
      available_sizes: ['S', 'M'],
      available_colors: ['Red', 'Blue'],
      distribution_mode: 'manual',
      variant_stock: {
        'Red-S': 10,
        'Blue-S': 5,
        'Red-M': 7,
        'Blue-M': 3
      },
      is_active: true
    };

    const response2 = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(manualDistributeProduct)
    });

    const data2 = await response2.json();

    if (response2.ok && data2.success) {
      console.log('✅ Product created successfully!');
      console.log(`Product ID: ${data2.data.id}`);
      console.log(`Total Stock: ${data2.data.total_stock}`);

      // Get product details to see variants
      const productId = data2.data.id;
      const detailResponse = await fetch(`${API_BASE}/products/${productId}`);
      const detailData = await detailResponse.json();

      if (detailData.success && detailData.data.variants) {
        console.log(`\n📊 Variants Created: ${detailData.data.variants.length}`);
        console.log('Variant Distribution:');

        let totalVariantStock = 0;
        detailData.data.variants.forEach(v => {
          console.log(`  - ${v.size} / ${v.color}: ${v.stock_quantity} units`);
          totalVariantStock += v.stock_quantity;
        });

        console.log(`\nTotal from variants: ${totalVariantStock} (should equal ${data2.data.total_stock})`);

        if (totalVariantStock === data2.data.total_stock) {
          console.log('✅ Stock distribution verified!');
        } else {
          console.log('❌ Stock mismatch!');
        }
      }
    } else {
      console.log('❌ Failed to create product');
      console.log('Error:', data2);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testProductCreation();
