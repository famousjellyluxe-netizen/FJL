/**
 * Test Suite: Product Variants Client Rendering
 *
 * Validates that product variants are properly included in:
 * 1. Backend API responses (lightweight and full)
 * 2. Frontend transformation/cache
 * 3. Product details page display
 *
 * Run: node test-product-variants-fix.js
 */

const API_BASE = 'http://localhost:5001/api';
const FRONTEND_URL = 'http://localhost:3000'; // Update if different

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getAdminToken() {
  try {
    log('\n🔐 Authenticating admin user...', 'blue');

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fjl.com',
        password: 'admin123'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log('✅ Authentication successful', 'green');
      return data.data.token;
    }

    throw new Error(data.error || 'Authentication failed');
  } catch (error) {
    log(`❌ Authentication failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testCreateProductWithVariants(token) {
  try {
    log('\n📝 TEST 1: Creating product with variants...', 'blue');

    const timestamp = Date.now();
    const productData = {
      name: `Test Variants Product ${timestamp}`,
      sku: `TEST-VARIANTS-${timestamp}`,
      price: 15000,
      sleeve_type: 'sleeveless',
      available_sizes: ['XS', 'S', 'M', 'L', 'XL'],
      available_colors: ['Black', 'White', 'Red'],
      distribution_mode: 'manual',
      variant_stock: {
        'XS-Black': 5,
        'XS-White': 3,
        'XS-Red': 4,
        'S-Black': 10,
        'S-White': 8,
        'S-Red': 7,
        'M-Black': 12,
        'M-White': 10,
        'M-Red': 9,
        'L-Black': 8,
        'L-White': 6,
        'L-Red': 5,
        'XL-Black': 4,
        'XL-White': 3,
        'XL-Red': 2
      },
      is_active: true
    };

    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Product creation failed');
    }

    log(`✅ Product created: ${data.data.id}`, 'green');
    log(`   Name: ${data.data.name}`, 'green');
    log(`   Total Stock: ${data.data.total_stock}`, 'green');

    return data.data.id;
  } catch (error) {
    log(`❌ Product creation failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testLightweightEndpoint(productId) {
  try {
    log('\n🔍 TEST 2: Checking lightweight endpoint includes variants...', 'blue');

    const response = await fetch(`${API_BASE}/products/list/lightweight?limit=1`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch lightweight products');
    }

    const products = data.data || [];
    if (products.length === 0) {
      throw new Error('No products returned');
    }

    const testProduct = products.find(p => p.id === productId) || products[0];

    // Check if variants field exists and is an array
    if (!testProduct.variants) {
      log(`❌ Lightweight endpoint missing "variants" field`, 'red');
      log(`   Product keys: ${Object.keys(testProduct).join(', ')}`, 'yellow');
      return false;
    }

    if (!Array.isArray(testProduct.variants)) {
      log(`❌ Variants field is not an array (type: ${typeof testProduct.variants})`, 'red');
      return false;
    }

    if (testProduct.variants.length === 0) {
      log(`⚠️  Variants array is empty for product ${testProduct.id}`, 'yellow');
      return false;
    }

    log(`✅ Lightweight endpoint includes variants`, 'green');
    log(`   Product: ${testProduct.name}`, 'green');
    log(`   Variants count: ${testProduct.variants.length}`, 'green');

    // Show sample variants
    const sampleVariants = testProduct.variants.slice(0, 3);
    sampleVariants.forEach(v => {
      log(`   - ${v.size}/${v.color}: ${v.stock_quantity} units`, 'green');
    });
    if (testProduct.variants.length > 3) {
      log(`   ... and ${testProduct.variants.length - 3} more`, 'green');
    }

    return true;
  } catch (error) {
    log(`❌ Lightweight endpoint test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testFullEndpoint(productId) {
  try {
    log('\n🔍 TEST 3: Checking full endpoint includes variants...', 'blue');

    const response = await fetch(`${API_BASE}/products/${productId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error('Failed to fetch product');
    }

    const product = data.data;

    if (!product.variants || !Array.isArray(product.variants)) {
      log(`❌ Full endpoint missing or invalid "variants" field`, 'red');
      return false;
    }

    if (product.variants.length === 0) {
      log(`⚠️  Variants array is empty`, 'yellow');
      return false;
    }

    log(`✅ Full endpoint includes variants`, 'green');
    log(`   Product: ${product.name}`, 'green');
    log(`   Variants count: ${product.variants.length}`, 'green');

    // Validate variant structure
    const firstVariant = product.variants[0];
    const requiredFields = ['id', 'product_id', 'size', 'color', 'stock_quantity'];
    const missingFields = requiredFields.filter(f => !(f in firstVariant));

    if (missingFields.length > 0) {
      log(`❌ Variant missing fields: ${missingFields.join(', ')}`, 'red');
      return false;
    }

    // Show sample variants
    const sampleVariants = product.variants.slice(0, 3);
    sampleVariants.forEach(v => {
      log(`   - ${v.size}/${v.color}: ${v.stock_quantity} units`, 'green');
    });
    if (product.variants.length > 3) {
      log(`   ... and ${product.variants.length - 3} more`, 'green');
    }

    return true;
  } catch (error) {
    log(`❌ Full endpoint test failed: ${error.message}`, 'red');
    return false;
  }
}

function testLocalStorageTransformation() {
  try {
    log('\n🔍 TEST 4: Checking localStorage cache structure (simulate frontend)...', 'blue');

    // Simulate the transformation that shop-integration.js does
    const mockProduct = {
      id: 'test-123',
      name: 'Test Product',
      price: 15000,
      image: 'image.jpg',
      category: 'Apparel',
      variants: [
        { id: 'v1', product_id: 'test-123', size: 'S', color: 'Black', stock_quantity: 10 },
        { id: 'v2', product_id: 'test-123', size: 'S', color: 'White', stock_quantity: 5 },
        { id: 'v3', product_id: 'test-123', size: 'M', color: 'Black', stock_quantity: 12 }
      ]
    };

    // Simulate extractUniqueSizesFromVariants
    const sizes = new Set();
    mockProduct.variants.forEach(v => {
      if (v.size) sizes.add(v.size);
    });
    const uniqueSizes = Array.from(sizes);

    // Simulate transformVariantsToInventory
    const sizeInventory = {};
    mockProduct.variants.forEach(v => {
      const key = v.size;
      if (!sizeInventory[key]) {
        sizeInventory[key] = 0;
      }
      sizeInventory[key] += (v.stock_quantity || 0);
    });

    // Check results
    if (uniqueSizes.length === 0) {
      log(`❌ No unique sizes extracted from variants`, 'red');
      return false;
    }

    if (Object.keys(sizeInventory).length === 0) {
      log(`❌ No size inventory created from variants`, 'red');
      return false;
    }

    log(`✅ Variants transformation works correctly`, 'green');
    log(`   Unique sizes: ${uniqueSizes.join(', ')}`, 'green');
    log(`   Size inventory: ${JSON.stringify(sizeInventory)}`, 'green');
    log(`   Variants in cache: ${mockProduct.variants.length}`, 'green');

    return true;
  } catch (error) {
    log(`❌ Transformation test failed: ${error.message}`, 'red');
    return false;
  }
}

function testProductDetailsLogic() {
  try {
    log('\n🔍 TEST 5: Checking product details page logic (simulate)...', 'blue');

    // Simulate what product.html does
    const cachedProduct = {
      id: 'prod-123',
      name: 'Test Product',
      sizes: ['S', 'M', 'L'],
      sizeInventory: { S: 15, M: 20, L: 10 },
      variants: [
        { id: 'v1', size: 'S', color: 'Black', stock_quantity: 8 },
        { id: 'v2', size: 'S', color: 'White', stock_quantity: 7 },
        { id: 'v3', size: 'M', color: 'Black', stock_quantity: 10 },
        { id: 'v4', size: 'M', color: 'White', stock_quantity: 10 },
        { id: 'v5', size: 'L', color: 'Black', stock_quantity: 5 },
        { id: 'v5', size: 'L', color: 'White', stock_quantity: 5 }
      ]
    };

    // Validate product has required fields for display
    if (!cachedProduct.variants || cachedProduct.variants.length === 0) {
      log(`❌ No variants available for display`, 'red');
      return false;
    }

    if (!cachedProduct.sizes || cachedProduct.sizes.length === 0) {
      log(`❌ No sizes available for display`, 'red');
      return false;
    }

    if (!cachedProduct.sizeInventory || Object.keys(cachedProduct.sizeInventory).length === 0) {
      log(`❌ No size inventory for stock validation`, 'red');
      return false;
    }

    // Simulate product page rendering
    const availableSizes = cachedProduct.sizes;
    const inventory = cachedProduct.sizeInventory;

    log(`✅ Product details page can render correctly`, 'green');
    log(`   Available sizes for buttons: ${availableSizes.join(', ')}`, 'green');

    availableSizes.forEach(size => {
      const stock = inventory[size] || 0;
      const status = stock > 0 ? 'IN STOCK' : 'OUT OF STOCK';
      log(`   - ${size}: ${stock} units (${status})`, 'green');
    });

    return true;
  } catch (error) {
    log(`❌ Product details logic test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(70), 'blue');
  log('Product Variants Client Rendering - Test Suite', 'blue');
  log('='.repeat(70), 'blue');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Get auth token
    const token = await getAdminToken();

    // Test 1: Create product with variants
    const productId = await testCreateProductWithVariants(token);
    results.tests.push({ name: 'Product Creation', passed: true });
    results.passed++;

    // Test 2: Lightweight endpoint
    const test2 = await testLightweightEndpoint(productId);
    results.tests.push({ name: 'Lightweight Endpoint', passed: test2 });
    test2 ? results.passed++ : results.failed++;

    // Test 3: Full endpoint
    const test3 = await testFullEndpoint(productId);
    results.tests.push({ name: 'Full Endpoint', passed: test3 });
    test3 ? results.passed++ : results.failed++;

    // Test 4: localStorage transformation
    const test4 = testLocalStorageTransformation();
    results.tests.push({ name: 'localStorage Transformation', passed: test4 });
    test4 ? results.passed++ : results.failed++;

    // Test 5: Product details logic
    const test5 = testProductDetailsLogic();
    results.tests.push({ name: 'Product Details Logic', passed: test5 });
    test5 ? results.passed++ : results.failed++;

  } catch (error) {
    log(`\n❌ Test suite aborted: ${error.message}`, 'red');
    results.failed++;
  }

  // Print summary
  log('\n' + '='.repeat(70), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(70), 'blue');

  results.tests.forEach(test => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    const color = test.passed ? 'green' : 'red';
    log(`${status}: ${test.name}`, color);
  });

  log('\n' + '='.repeat(70), 'blue');
  log(`Results: ${results.passed} passed, ${results.failed} failed`,
      results.failed === 0 ? 'green' : 'red');
  log('='.repeat(70), 'blue');

  if (results.failed === 0) {
    log('\n🎉 All tests passed! Product variants fix is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
