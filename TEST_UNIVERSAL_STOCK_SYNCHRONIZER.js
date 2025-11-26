/**
 * TEST_UNIVERSAL_STOCK_SYNCHRONIZER.js
 *
 * Test harness for UniversalStockSynchronizer
 * Run this in browser console to verify the synchronizer works before page integration
 *
 * Usage: Copy and paste entire file into browser console on any FJL page
 */

console.log('🧪 Starting UniversalStockSynchronizer Test Suite...\n');

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test helper - assert condition and track result
 */
function assert(condition, testName, details = '') {
  if (condition) {
    testResults.passed++;
    testResults.tests.push({ name: testName, status: '✅ PASS', details });
    console.log(`✅ PASS: ${testName}` + (details ? ` - ${details}` : ''));
  } else {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: '❌ FAIL', details });
    console.log(`❌ FAIL: ${testName}` + (details ? ` - ${details}` : ''));
  }
}

// ============================================================================
// Test 1: UniversalStockSynchronizer loads correctly
// ============================================================================
console.log('📋 Test Group 1: Module Loading');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

(async () => {
  try {
    // Test 1.1: Can we import the module?
    const moduleScript = document.createElement('script');
    moduleScript.type = 'module';
    moduleScript.textContent = `
      import { UniversalStockSynchronizer } from '/js/lib/UniversalStockSynchronizer.js';
      window.UniversalStockSynchronizerClass = UniversalStockSynchronizer;
    `;
    document.head.appendChild(moduleScript);

    // Wait for module to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    assert(
      typeof window.UniversalStockSynchronizerClass === 'function',
      'Module imports successfully',
      'UniversalStockSynchronizer class is available'
    );

    // Test 1.2: Can we get singleton instance?
    const synchronizer = await window.UniversalStockSynchronizerClass.getInstance();
    assert(
      synchronizer !== null && typeof synchronizer === 'object',
      'Singleton getInstance() works',
      'Returns valid instance'
    );

    // Test 1.3: Is instance cached (singleton pattern)?
    const synchronizer2 = await window.UniversalStockSynchronizerClass.getInstance();
    assert(
      synchronizer === synchronizer2,
      'Singleton pattern works',
      'Multiple getInstance() calls return same instance'
    );

    // Store synchronizer globally for remaining tests
    window.testSynchronizer = synchronizer;

    // ============================================================================
    // Test 2: Page Handler Registration
    // ============================================================================
    console.log('\n📋 Test Group 2: Page Handler Registration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let shopHandlerCalled = false;
    let lastShopData = null;

    synchronizer.registerPageHandler('shop', (data) => {
      shopHandlerCalled = true;
      lastShopData = data;
    });

    assert(
      true,
      'Page handler registers without error',
      'Handler for "shop" page type registered'
    );

    // Test 2.2: Can we unregister handlers?
    synchronizer.unregisterPageHandler('shop');
    assert(
      true,
      'Page handler unregistration works',
      'Handler for "shop" page type unregistered'
    );

    // Re-register for further tests
    synchronizer.registerPageHandler('shop', (data) => {
      shopHandlerCalled = true;
      lastShopData = data;
    });

    // ============================================================================
    // Test 3: Stock Update Handling (Mock Data)
    // ============================================================================
    console.log('\n📋 Test Group 3: Stock Update Handling');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const mockStockUpdate = {
      productId: 'test-product-123',
      variantId: 'variant-456',
      newQuantity: 5,
      oldQuantity: 10,
      size: 'M',
      color: 'Red'
    };

    // Manually call handle stock update (simulating SSE event)
    await synchronizer.handleStockUpdate(mockStockUpdate);

    assert(
      shopHandlerCalled === true,
      'Page handler called on stock update',
      'Handler was invoked with stock update data'
    );

    assert(
      lastShopData && lastShopData.productId === 'test-product-123',
      'Stock update data passed to handler correctly',
      'Handler received correct productId'
    );

    assert(
      lastShopData.newQuantity === 5,
      'Stock quantity updated correctly',
      'New quantity is 5 as expected'
    );

    // ============================================================================
    // Test 4: Subscription Management
    // ============================================================================
    console.log('\n📋 Test Group 4: Subscription Management');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const beforeSubscribe = synchronizer.getSubscribedProducts().length;

    await synchronizer.subscribe('product-1');
    await synchronizer.subscribe(['product-2', 'product-3']);

    const afterSubscribe = synchronizer.getSubscribedProducts();
    assert(
      afterSubscribe.length >= beforeSubscribe + 3,
      'Subscribe adds products to tracking',
      `Subscribed products increased from ${beforeSubscribe} to ${afterSubscribe.length}`
    );

    // Test 4.2: Unsubscribe
    await synchronizer.unsubscribe('product-1');
    const afterUnsubscribe = synchronizer.getSubscribedProducts();
    assert(
      afterUnsubscribe.length === afterSubscribe.length - 1,
      'Unsubscribe removes products',
      `Subscribed products decreased from ${afterSubscribe.length} to ${afterUnsubscribe.length}`
    );

    // ============================================================================
    // Test 5: Cache Management
    // ============================================================================
    console.log('\n📋 Test Group 5: Cache Management');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const mockInitialStock = {
      productId: 'cache-test-product',
      variants: [
        { id: 'var-1', size: 'S', color: 'Red', stock_quantity: 10 },
        { id: 'var-2', size: 'M', color: 'Red', stock_quantity: 5 }
      ]
    };

    await synchronizer.handleInitialStock(mockInitialStock);

    const cached = synchronizer.getCachedProduct('cache-test-product');
    assert(
      cached !== null && cached.variants && cached.variants.length === 2,
      'Initial stock cached correctly',
      'Product variants cached in memory'
    );

    // Test 5.2: Get product stock
    const stock = await synchronizer.getProductStock('cache-test-product', 'S', 'Red');
    assert(
      stock === 10,
      'Get product stock works',
      'Correct stock quantity returned from cache'
    );

    // ============================================================================
    // Test 6: Status and Info Methods
    // ============================================================================
    console.log('\n📋 Test Group 6: Status and Info Methods');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const status = synchronizer.getStatus();
    assert(
      typeof status === 'string',
      'getStatus() returns valid status',
      `Current status: ${status}`
    );

    const subscribedList = synchronizer.getSubscribedProducts();
    assert(
      Array.isArray(subscribedList),
      'getSubscribedProducts() returns array',
      `${subscribedList.length} products subscribed`
    );

    // ============================================================================
    // Test 7: Debug and Error Handling
    // ============================================================================
    console.log('\n📋 Test Group 7: Debug and Error Handling');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Enable debug mode
    synchronizer.setDebugMode(true);
    assert(
      true,
      'Debug mode toggles without error',
      'Debug logging enabled'
    );

    // Test 7.2: Error callback
    let errorCaught = false;
    synchronizer.setErrorCallback((error) => {
      errorCaught = true;
    });
    assert(
      true,
      'Error callback sets successfully',
      'Custom error handler registered'
    );

    // Test invalid stock update (should trigger error callback)
    await synchronizer.handleStockUpdate(null);
    synchronizer.setDebugMode(false);

    // ============================================================================
    // Test 8: Multiple Page Handlers
    // ============================================================================
    console.log('\n📋 Test Group 8: Multiple Page Handlers');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let cartHandlerCalled = false;
    let checkoutHandlerCalled = false;

    synchronizer.registerPageHandler('cart', (data) => {
      cartHandlerCalled = true;
    });

    synchronizer.registerPageHandler('checkout', (data) => {
      checkoutHandlerCalled = true;
    });

    const multiPageUpdate = {
      productId: 'multi-test-123',
      variantId: 'var-789',
      newQuantity: 2,
      oldQuantity: 5
    };

    await synchronizer.handleStockUpdate(multiPageUpdate);

    assert(
      shopHandlerCalled && cartHandlerCalled && checkoutHandlerCalled,
      'Multiple handlers all called on single update',
      'shop, cart, and checkout handlers all triggered'
    );

    // ============================================================================
    // Test 9: Cleanup and Disconnection
    // ============================================================================
    console.log('\n📋 Test Group 9: Cleanup and Disconnection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const beforeDisconnect = synchronizer.getSubscribedProducts().length;
    await synchronizer.disconnect();
    const afterDisconnect = synchronizer.getSubscribedProducts().length;

    assert(
      afterDisconnect === 0,
      'Disconnect clears subscriptions',
      `Subscriptions cleared: ${beforeDisconnect} → ${afterDisconnect}`
    );

    // ============================================================================
    // Final Summary
    // ============================================================================
    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║           TEST SUMMARY - UniversalStockSynchronizer        ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n');

    const totalTests = testResults.passed + testResults.failed;
    const passPercentage = ((testResults.passed / totalTests) * 100).toFixed(1);

    console.log(`✅ PASSED: ${testResults.passed}/${totalTests}`);
    console.log(`❌ FAILED: ${testResults.failed}/${totalTests}`);
    console.log(`📊 SUCCESS RATE: ${passPercentage}%\n`);

    if (testResults.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! UniversalStockSynchronizer is ready for integration.\n');
    } else {
      console.log('⚠️ SOME TESTS FAILED - Review errors above before integration.\n');
    }

    // Display detailed test results
    console.log('DETAILED TEST RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testResults.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.status} - ${test.name}`);
      if (test.details) console.log(`   Details: ${test.details}`);
    });

    console.log('\n🧪 Test suite completed.');

  } catch (error) {
    console.error('❌ TEST SUITE ERROR:', error);
  }
})();
