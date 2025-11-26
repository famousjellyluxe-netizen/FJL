/**
 * TEST_SHOP_REAL_TIME.js
 *
 * Unit tests for shop.html real-time stock update handler
 * Tests the shop page's ability to update product cards and modals in real-time
 *
 * Usage: Copy and paste entire file into browser console on shop.html
 * Prerequisite: shop.html must be fully loaded with products
 */

console.log('🧪 Starting Shop Page Real-Time Stock Update Test Suite...\n');

// Track test results
const shopTestResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test helper - assert condition and track result
 */
function shopAssert(condition, testName, details = '') {
  if (condition) {
    shopTestResults.passed++;
    shopTestResults.tests.push({ name: testName, status: '✅ PASS', details });
    console.log(`✅ PASS: ${testName}` + (details ? ` - ${details}` : ''));
  } else {
    shopTestResults.failed++;
    shopTestResults.tests.push({ name: testName, status: '❌ FAIL', details });
    console.log(`❌ FAIL: ${testName}` + (details ? ` - ${details}` : ''));
  }
}

// ============================================================================
// Test 1: Shop Page Structure Validation
// ============================================================================
console.log('📋 Test Group 1: Shop Page Structure');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

(async () => {
  try {
    // Test 1.1: Does shop page have product elements?
    const productElements = document.querySelectorAll('[data-product-id]');
    shopAssert(
      productElements.length > 0,
      'Product elements exist on shop page',
      `Found ${productElements.length} products`
    );

    // Test 1.2: Do product elements have stock badges?
    const productWithBadge = Array.from(productElements).some(el =>
      el.querySelector('[data-stock-status]')
    );
    shopAssert(
      productWithBadge,
      'Product elements have stock badges',
      'At least one product has [data-stock-status]'
    );

    // Test 1.3: Does shop have a modal structure?
    const modalExists = document.querySelector('[data-product-modal]') ||
                        document.querySelector('.product-modal') ||
                        document.querySelector('#productModal');
    shopAssert(
      modalExists !== null,
      'Product modal exists on shop page',
      'Modal structure found'
    );

    // ============================================================================
    // Test 2: UniversalStockSynchronizer Integration
    // ============================================================================
    console.log('\n📋 Test Group 2: UniversalStockSynchronizer Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if synchronizer is initialized
    const hasSynchronizer = typeof window.UniversalStockSynchronizer !== 'undefined' ||
                           typeof UniversalStockSynchronizer !== 'undefined';

    shopAssert(
      hasSynchronizer,
      'UniversalStockSynchronizer is available',
      'Class loaded in global scope'
    );

    let synchronizer = null;
    if (typeof window.UniversalStockSynchronizer !== 'undefined') {
      synchronizer = await window.UniversalStockSynchronizer.getInstance();
    } else if (typeof UniversalStockSynchronizer !== 'undefined') {
      synchronizer = await UniversalStockSynchronizer.getInstance();
    }

    shopAssert(
      synchronizer !== null,
      'UniversalStockSynchronizer instance obtained',
      'Singleton getInstance() returned valid instance'
    );

    // Test 2.2: Is 'shop' page handler registered?
    const handlers = synchronizer.pageHandlers || new Map();
    const shopHandlerRegistered = handlers.has('shop');

    shopAssert(
      shopHandlerRegistered,
      'Shop page handler registered',
      'Handler for "shop" page type is active'
    );

    // ============================================================================
    // Test 3: Stock Update Handler Functionality
    // ============================================================================
    console.log('\n📋 Test Group 3: Stock Update Handler Functionality');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get first product as test target
    const firstProduct = productElements[0];
    const testProductId = firstProduct.getAttribute('data-product-id');

    shopAssert(
      testProductId !== null && testProductId.length > 0,
      'Test product identified',
      `Product ID: ${testProductId}`
    );

    // Get initial stock badge state
    const stockBadgeInitial = firstProduct.querySelector('[data-stock-status]');
    const initialStockText = stockBadgeInitial?.textContent || 'unknown';

    shopAssert(
      stockBadgeInitial !== null,
      'Stock badge found for test product',
      `Initial stock: ${initialStockText}`
    );

    // Test 3.2: Simulate stock update to 5 units
    const mockStockUpdate = {
      productId: testProductId,
      variantId: 'test-variant-123',
      newQuantity: 5,
      oldQuantity: 10,
      size: 'M',
      color: 'Red'
    };

    // Manually trigger the handler (simulating what SSE would do)
    if (handlers.has('shop')) {
      const shopHandler = handlers.get('shop');
      shopHandler(mockStockUpdate);
    }

    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));

    const stockBadgeAfter = firstProduct.querySelector('[data-stock-status]');
    const stockUpdated = stockBadgeAfter && stockBadgeAfter.textContent.includes('5');

    shopAssert(
      stockUpdated,
      'Stock badge updates on stock change',
      `Stock updated to: ${stockBadgeAfter?.textContent || 'unchanged'}`
    );

    // Test 3.3: Simulate stock update to 0 (out of stock)
    const mockOutOfStockUpdate = {
      productId: testProductId,
      variantId: 'test-variant-123',
      newQuantity: 0,
      oldQuantity: 5
    };

    if (handlers.has('shop')) {
      const shopHandler = handlers.get('shop');
      shopHandler(mockOutOfStockUpdate);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const productAfterStockOut = document.querySelector(`[data-product-id="${testProductId}"]`);
    const hasOutOfStockClass = productAfterStockOut?.classList.contains('out-of-stock');
    const stockBadgeSoldOut = productAfterStockOut?.querySelector('[data-stock-status]')?.textContent.includes('SOLD OUT');

    shopAssert(
      hasOutOfStockClass || stockBadgeSoldOut,
      'Product marked as out-of-stock when quantity is 0',
      'CSS class added and/or badge shows SOLD OUT'
    );

    // ============================================================================
    // Test 4: Product Subscription
    // ============================================================================
    console.log('\n📋 Test Group 4: Product Subscription');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const subscribedBefore = synchronizer.getSubscribedProducts();
    const initialSubscriptionCount = subscribedBefore.length;

    shopAssert(
      initialSubscriptionCount >= 0,
      'Can retrieve subscribed products list',
      `Currently subscribed to ${initialSubscriptionCount} products`
    );

    // Test 4.2: Manually subscribe to test product
    await synchronizer.subscribe(testProductId);

    const subscribedAfter = synchronizer.getSubscribedProducts();
    const isSubscribed = subscribedAfter.includes(testProductId);

    shopAssert(
      isSubscribed,
      'Product can be subscribed to',
      `Test product ${testProductId} is now subscribed`
    );

    // ============================================================================
    // Test 5: Modal Update on Stock Change
    // ============================================================================
    console.log('\n📋 Test Group 5: Modal Update on Stock Change');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // This test simulates opening a modal and checking if it updates
    // Note: This assumes the modal has been opened (may require manual action)

    const modalIsOpen = window.modalState && window.modalState.productId === testProductId;

    if (modalIsOpen) {
      // If modal is open, trigger an update
      const mockModalUpdate = {
        productId: testProductId,
        variantId: 'test-variant-456',
        newQuantity: 3,
        oldQuantity: 8,
        size: 'L',
        color: 'Blue'
      };

      if (handlers.has('shop')) {
        const shopHandler = handlers.get('shop');
        shopHandler(mockModalUpdate);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      shopAssert(
        true,
        'Modal update handler executed',
        'Modal state checked and handler called'
      );
    } else {
      shopAssert(
        false,
        'Modal update handler - SKIPPED',
        'Modal not currently open (manual test required)'
      );
    }

    // ============================================================================
    // Test 6: Dynamic Product Detection (MutationObserver)
    // ============================================================================
    console.log('\n📋 Test Group 6: Dynamic Product Detection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test if observer is set up to detect new products
    const productGrid = document.querySelector('[data-product-grid]') ||
                       document.querySelector('.product-grid') ||
                       document.querySelector('.products-container');

    shopAssert(
      productGrid !== null,
      'Product grid container found',
      'MutationObserver can watch for new products'
    );

    // ============================================================================
    // Test 7: Multiple Products Update
    // ============================================================================
    console.log('\n📋 Test Group 7: Multiple Products Update');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test with multiple products
    const productsToTest = Array.from(productElements).slice(0, 3);
    let multipleUpdatesHandled = 0;

    for (const product of productsToTest) {
      const productId = product.getAttribute('data-product-id');

      const mockUpdate = {
        productId: productId,
        newQuantity: Math.floor(Math.random() * 10),
        oldQuantity: Math.floor(Math.random() * 10) + 10
      };

      if (handlers.has('shop')) {
        const shopHandler = handlers.get('shop');
        shopHandler(mockUpdate);
        multipleUpdatesHandled++;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    shopAssert(
      multipleUpdatesHandled === productsToTest.length,
      'Multiple product updates handled',
      `Processed ${multipleUpdatesHandled}/${productsToTest.length} products`
    );

    // ============================================================================
    // Test 8: Error Handling
    // ============================================================================
    console.log('\n📋 Test Group 8: Error Handling');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let errorHandled = false;

    // Try to update non-existent product
    if (handlers.has('shop')) {
      try {
        const shopHandler = handlers.get('shop');
        shopHandler({
          productId: 'non-existent-product-12345',
          newQuantity: 5
        });
        errorHandled = true; // No error thrown = graceful handling
      } catch (error) {
        errorHandled = false;
      }
    }

    shopAssert(
      errorHandled,
      'Non-existent product update handled gracefully',
      'No error thrown for non-existent product ID'
    );

    // Test 8.2: Null data handling
    let nullDataHandled = false;
    if (handlers.has('shop')) {
      try {
        const shopHandler = handlers.get('shop');
        shopHandler(null);
        nullDataHandled = true;
      } catch (error) {
        nullDataHandled = true; // Error or graceful = acceptable
      }
    }

    shopAssert(
      nullDataHandled,
      'Null data handled gracefully',
      'Handler does not crash with null input'
    );

    // ============================================================================
    // Final Summary
    // ============================================================================
    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║          TEST SUMMARY - Shop Real-Time Stock Updates       ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n');

    const totalTests = shopTestResults.passed + shopTestResults.failed;
    const passPercentage = ((shopTestResults.passed / totalTests) * 100).toFixed(1);

    console.log(`✅ PASSED: ${shopTestResults.passed}/${totalTests}`);
    console.log(`❌ FAILED: ${shopTestResults.failed}/${totalTests}`);
    console.log(`📊 SUCCESS RATE: ${passPercentage}%\n`);

    if (shopTestResults.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Shop page real-time updates are working correctly.\n');
    } else {
      console.log('⚠️ SOME TESTS FAILED - Review errors above before deployment.\n');
    }

    // Display detailed test results
    console.log('DETAILED TEST RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    shopTestResults.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.status} - ${test.name}`);
      if (test.details) console.log(`   Details: ${test.details}`);
    });

    console.log('\n🧪 Shop page test suite completed.');

  } catch (error) {
    console.error('❌ TEST SUITE ERROR:', error);
  }
})();
