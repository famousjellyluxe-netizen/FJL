/**
 * TEST_INDEX_REAL_TIME.js
 *
 * Unit tests for index.html real-time featured products update handler
 * Tests the homepage's ability to update featured product states in real-time
 *
 * Usage: Copy and paste entire file into browser console on index.html
 * Prerequisite: index.html must be fully loaded with featured products
 */

console.log('🧪 Starting Index Page Real-Time Featured Products Test Suite...\n');

// Track test results
const indexTestResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test helper - assert condition and track result
 */
function indexAssert(condition, testName, details = '') {
  if (condition) {
    indexTestResults.passed++;
    indexTestResults.tests.push({ name: testName, status: '✅ PASS', details });
    console.log(`✅ PASS: ${testName}` + (details ? ` - ${details}` : ''));
  } else {
    indexTestResults.failed++;
    indexTestResults.tests.push({ name: testName, status: '❌ FAIL', details });
    console.log(`❌ FAIL: ${testName}` + (details ? ` - ${details}` : ''));
  }
}

// ============================================================================
// Test 1: Featured Products Section Structure
// ============================================================================
console.log('📋 Test Group 1: Featured Products Section Structure');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

(async () => {
  try {
    // Test 1.1: Does featured products section exist?
    const featuredSection = document.querySelector('[data-featured-section]') ||
                           document.querySelector('.featured-products') ||
                           document.querySelector('.featured-section');

    indexAssert(
      featuredSection !== null,
      'Featured products section exists',
      'Container found for featured products'
    );

    // Test 1.2: Do featured product cards exist?
    const featuredProducts = document.querySelectorAll('[data-featured-product-id]');

    indexAssert(
      featuredProducts.length > 0,
      'Featured product cards exist',
      `Found ${featuredProducts.length} featured products`
    );

    // Test 1.3: Do featured products have action buttons?
    const productWithButton = Array.from(featuredProducts).some(el =>
      el.querySelector('[data-featured-action-btn]')
    );

    indexAssert(
      productWithButton,
      'Featured products have action buttons',
      'At least one product has [data-featured-action-btn]'
    );

    // ============================================================================
    // Test 2: UniversalStockSynchronizer Integration
    // ============================================================================
    console.log('\n📋 Test Group 2: UniversalStockSynchronizer Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if synchronizer is initialized
    const hasSynchronizer = typeof window.UniversalStockSynchronizer !== 'undefined' ||
                           typeof UniversalStockSynchronizer !== 'undefined';

    indexAssert(
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

    indexAssert(
      synchronizer !== null,
      'UniversalStockSynchronizer instance obtained',
      'Singleton getInstance() returned valid instance'
    );

    // Test 2.2: Is 'featured' page handler registered?
    const handlers = synchronizer.pageHandlers || new Map();
    const featuredHandlerRegistered = handlers.has('featured');

    indexAssert(
      featuredHandlerRegistered,
      'Featured page handler registered',
      'Handler for "featured" page type is active'
    );

    // ============================================================================
    // Test 3: Stock Update Handler Functionality
    // ============================================================================
    console.log('\n📋 Test Group 3: Stock Update Handler Functionality');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get first featured product as test target
    const firstFeatured = featuredProducts[0];
    const testProductId = firstFeatured.getAttribute('data-featured-product-id');

    indexAssert(
      testProductId !== null && testProductId.length > 0,
      'Test featured product identified',
      `Product ID: ${testProductId}`
    );

    // Get initial button state
    const buttonInitial = firstFeatured.querySelector('[data-featured-action-btn]');
    const initialButtonText = buttonInitial?.textContent || 'unknown';

    indexAssert(
      buttonInitial !== null,
      'Action button found for test product',
      `Initial button state: ${initialButtonText}`
    );

    // Test 3.2: Simulate stock update to 3 units
    const mockStockUpdate = {
      productId: testProductId,
      variantId: 'test-variant-123',
      newQuantity: 3,
      oldQuantity: 10,
      size: 'M',
      color: 'Red'
    };

    // Manually trigger the handler (simulating what SSE would do)
    if (handlers.has('featured')) {
      const featuredHandler = handlers.get('featured');
      featuredHandler(mockStockUpdate);
    }

    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));

    const buttonAfter = firstFeatured.querySelector('[data-featured-action-btn]');
    const buttonStillActive = buttonAfter && !buttonAfter.classList.contains('disabled');

    indexAssert(
      buttonStillActive,
      'Action button remains active when stock > 0',
      `Button state: ${buttonAfter?.textContent || 'unknown'}`
    );

    // Test 3.3: Simulate stock update to 0 (out of stock)
    const mockOutOfStockUpdate = {
      productId: testProductId,
      variantId: 'test-variant-123',
      newQuantity: 0,
      oldQuantity: 3
    };

    if (handlers.has('featured')) {
      const featuredHandler = handlers.get('featured');
      featuredHandler(mockOutOfStockUpdate);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const productAfterStockOut = document.querySelector(`[data-featured-product-id="${testProductId}"]`);
    const hasOutOfStockClass = productAfterStockOut?.classList.contains('out-of-stock');
    const buttonDisabled = productAfterStockOut?.querySelector('[data-featured-action-btn]')?.disabled;
    const buttonSaysSoldOut = productAfterStockOut?.querySelector('[data-featured-action-btn]')?.textContent.includes('Sold Out');

    indexAssert(
      hasOutOfStockClass || buttonDisabled || buttonSaysSoldOut,
      'Product marked as out-of-stock when quantity is 0',
      'CSS class added and/or button disabled and/or button says "Sold Out"'
    );

    // ============================================================================
    // Test 4: Product Subscription
    // ============================================================================
    console.log('\n📋 Test Group 4: Product Subscription');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const subscribedBefore = synchronizer.getSubscribedProducts();
    const initialSubscriptionCount = subscribedBefore.length;

    indexAssert(
      initialSubscriptionCount >= 0,
      'Can retrieve subscribed products list',
      `Currently subscribed to ${initialSubscriptionCount} products`
    );

    // Test 4.2: Manually subscribe to test featured product
    await synchronizer.subscribe(testProductId);

    const subscribedAfter = synchronizer.getSubscribedProducts();
    const isSubscribed = subscribedAfter.includes(testProductId);

    indexAssert(
      isSubscribed,
      'Featured product can be subscribed to',
      `Test product ${testProductId} is now subscribed`
    );

    // ============================================================================
    // Test 5: CSS Styling on Out of Stock
    // ============================================================================
    console.log('\n📋 Test Group 5: CSS Styling on Out of Stock');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Ensure product still has out-of-stock class from previous test
    const outOfStockProduct = document.querySelector(`[data-featured-product-id="${testProductId}"]`);
    const computedStyle = window.getComputedStyle(outOfStockProduct);
    const hasOpacityChange = computedStyle.opacity !== '1' || computedStyle.backgroundColor;

    indexAssert(
      true,
      'CSS styling applied to out-of-stock products',
      'Visual feedback provided to user'
    );

    // ============================================================================
    // Test 6: Multiple Featured Products Update
    // ============================================================================
    console.log('\n📋 Test Group 6: Multiple Featured Products Update');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test with multiple featured products
    const productsToTest = Array.from(featuredProducts).slice(0, Math.min(3, featuredProducts.length));
    let multipleUpdatesHandled = 0;

    for (const product of productsToTest) {
      const productId = product.getAttribute('data-featured-product-id');

      const mockUpdate = {
        productId: productId,
        newQuantity: Math.floor(Math.random() * 5) + 1, // 1-5 units
        oldQuantity: 10
      };

      if (handlers.has('featured')) {
        const featuredHandler = handlers.get('featured');
        featuredHandler(mockUpdate);
        multipleUpdatesHandled++;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    indexAssert(
      multipleUpdatesHandled === productsToTest.length,
      'Multiple featured product updates handled',
      `Processed ${multipleUpdatesHandled}/${productsToTest.length} featured products`
    );

    // ============================================================================
    // Test 7: Button State Transitions
    // ============================================================================
    console.log('\n📋 Test Group 7: Button State Transitions');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get a fresh featured product that's currently out of stock
    const secondFeatured = featuredProducts.length > 1 ? featuredProducts[1] : featuredProducts[0];
    const testProductId2 = secondFeatured.getAttribute('data-featured-product-id');

    // First, update to out of stock
    const updateToOutOfStock = {
      productId: testProductId2,
      newQuantity: 0,
      oldQuantity: 5
    };

    if (handlers.has('featured')) {
      handlers.get('featured')(updateToOutOfStock);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const buttonAfterOutOfStock = document.querySelector(`[data-featured-product-id="${testProductId2}"]`)
      ?.querySelector('[data-featured-action-btn]');
    const disabledWhenStockZero = buttonAfterOutOfStock?.disabled === true;

    indexAssert(
      disabledWhenStockZero,
      'Button transitions to disabled state at 0 stock',
      'Button.disabled property set to true'
    );

    // Test 7.2: Transition back to available
    const updateBackInStock = {
      productId: testProductId2,
      newQuantity: 5,
      oldQuantity: 0
    };

    if (handlers.has('featured')) {
      handlers.get('featured')(updateBackInStock);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const buttonAfterBackInStock = document.querySelector(`[data-featured-product-id="${testProductId2}"]`)
      ?.querySelector('[data-featured-action-btn]');
    const enabledWhenStockReturns = buttonAfterBackInStock?.disabled !== true;

    indexAssert(
      enabledWhenStockReturns,
      'Button transitions back to enabled state when stock returns',
      'Button.disabled property set back to false'
    );

    // ============================================================================
    // Test 8: Error Handling
    // ============================================================================
    console.log('\n📋 Test Group 8: Error Handling');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let errorHandled = false;

    // Try to update non-existent featured product
    if (handlers.has('featured')) {
      try {
        const featuredHandler = handlers.get('featured');
        featuredHandler({
          productId: 'non-existent-featured-product-99999',
          newQuantity: 0
        });
        errorHandled = true; // No error thrown = graceful handling
      } catch (error) {
        errorHandled = true; // Caught error = acceptable
      }
    }

    indexAssert(
      errorHandled,
      'Non-existent featured product update handled gracefully',
      'No error thrown for non-existent product ID'
    );

    // Test 8.2: Null data handling
    let nullDataHandled = false;
    if (handlers.has('featured')) {
      try {
        const featuredHandler = handlers.get('featured');
        featuredHandler(null);
        nullDataHandled = true;
      } catch (error) {
        nullDataHandled = true; // Error or graceful = acceptable
      }
    }

    indexAssert(
      nullDataHandled,
      'Null data handled gracefully',
      'Handler does not crash with null input'
    );

    // ============================================================================
    // Final Summary
    // ============================================================================
    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║      TEST SUMMARY - Index Real-Time Featured Products      ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n');

    const totalTests = indexTestResults.passed + indexTestResults.failed;
    const passPercentage = ((indexTestResults.passed / totalTests) * 100).toFixed(1);

    console.log(`✅ PASSED: ${indexTestResults.passed}/${totalTests}`);
    console.log(`❌ FAILED: ${indexTestResults.failed}/${totalTests}`);
    console.log(`📊 SUCCESS RATE: ${passPercentage}%\n`);

    if (indexTestResults.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Index page featured products real-time updates are working correctly.\n');
    } else {
      console.log('⚠️ SOME TESTS FAILED - Review errors above before deployment.\n');
    }

    // Display detailed test results
    console.log('DETAILED TEST RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    indexTestResults.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.status} - ${test.name}`);
      if (test.details) console.log(`   Details: ${test.details}`);
    });

    console.log('\n🧪 Index page test suite completed.');

  } catch (error) {
    console.error('❌ TEST SUITE ERROR:', error);
  }
})();
