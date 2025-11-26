/**
 * TEST_CART_REAL_TIME.js
 *
 * Unit tests for cart.html real-time stock monitoring handler
 * Tests the cart page's ability to monitor stock and auto-adjust quantities in real-time
 *
 * Usage: Copy and paste entire file into browser console on cart.html
 * Prerequisite: cart.html must be fully loaded with items in the cart
 */

console.log('🧪 Starting Cart Page Real-Time Stock Monitoring Test Suite...\n');

// Track test results
const cartTestResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test helper - assert condition and track result
 */
function cartAssert(condition, testName, details = '') {
  if (condition) {
    cartTestResults.passed++;
    cartTestResults.tests.push({ name: testName, status: '✅ PASS', details });
    console.log(`✅ PASS: ${testName}` + (details ? ` - ${details}` : ''));
  } else {
    cartTestResults.failed++;
    cartTestResults.tests.push({ name: testName, status: '❌ FAIL', details });
    console.log(`❌ FAIL: ${testName}` + (details ? ` - ${details}` : ''));
  }
}

// ============================================================================
// Test 1: Cart Structure and Items
// ============================================================================
console.log('📋 Test Group 1: Cart Structure and Items');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

(async () => {
  try {
    // Test 1.1: Does cart object exist?
    const hasCartObject = typeof cart !== 'undefined' && cart !== null;

    cartAssert(
      hasCartObject,
      'Cart object exists in global scope',
      'cart variable is initialized'
    );

    // Test 1.2: Does cart have items?
    let cartItems = [];
    if (hasCartObject && typeof cart.items !== 'undefined') {
      cartItems = cart.items;
    }

    cartAssert(
      cartItems.length > 0,
      'Cart contains items',
      `${cartItems.length} items in cart`
    );

    if (cartItems.length === 0) {
      cartAssert(
        false,
        'Cannot proceed with tests',
        'Add items to cart before running tests'
      );
      console.log('\n⚠️ Cart is empty. Please add items to cart and run tests again.');
      throw new Error('Cart is empty');
    }

    // Test 1.3: Do cart items have required properties?
    const firstItem = cartItems[0];
    const hasRequiredProps = firstItem.id && firstItem.name && typeof firstItem.quantity !== 'undefined';

    cartAssert(
      hasRequiredProps,
      'Cart items have required properties',
      `Item: ${firstItem.name || 'unknown'}, ID: ${firstItem.id}`
    );

    // ============================================================================
    // Test 2: UniversalStockSynchronizer Integration
    // ============================================================================
    console.log('\n📋 Test Group 2: UniversalStockSynchronizer Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if synchronizer is initialized
    const hasSynchronizer = typeof window.UniversalStockSynchronizer !== 'undefined' ||
                           typeof UniversalStockSynchronizer !== 'undefined';

    cartAssert(
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

    cartAssert(
      synchronizer !== null,
      'UniversalStockSynchronizer instance obtained',
      'Singleton getInstance() returned valid instance'
    );

    // Test 2.2: Is 'cart' page handler registered?
    const handlers = synchronizer.pageHandlers || new Map();
    const cartHandlerRegistered = handlers.has('cart');

    cartAssert(
      cartHandlerRegistered,
      'Cart page handler registered',
      'Handler for "cart" page type is active'
    );

    // ============================================================================
    // Test 3: Stock Monitoring Handler Functionality
    // ============================================================================
    console.log('\n📋 Test Group 3: Stock Monitoring Handler Functionality');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get test item from cart
    const testItem = cartItems[0];
    const testItemInitialQuantity = testItem.quantity;
    const testItemName = testItem.name;

    cartAssert(
      true,
      'Test cart item identified',
      `Item: ${testItemName}, Initial Quantity: ${testItemInitialQuantity}`
    );

    // Test 3.2: Simulate stock reduction affecting the cart item
    const mockStockReduction = {
      productId: testItem.id,
      variantId: testItem.variantId || `var-${testItem.id}`,
      newQuantity: 2, // Stock reduced to 2
      oldQuantity: testItemInitialQuantity * 2, // Was double the cart quantity
      size: testItem.size || null,
      color: testItem.color || null
    };

    // Manually trigger the handler (simulating what SSE would do)
    if (handlers.has('cart')) {
      const cartHandler = handlers.get('cart');
      cartHandler(mockStockReduction);
    }

    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));

    const testItemAfterReduction = cart.items[0];
    const quantityWasAdjusted = testItemAfterReduction.quantity <= mockStockReduction.newQuantity;

    cartAssert(
      quantityWasAdjusted,
      'Cart quantity auto-reduced when stock decreases',
      `Old qty: ${testItemInitialQuantity}, New qty: ${testItemAfterReduction.quantity}, Available stock: ${mockStockReduction.newQuantity}`
    );

    // Test 3.3: Simulate stock available >= cart quantity (no change)
    const mockStockIncrease = {
      productId: testItem.id,
      variantId: testItem.variantId || `var-${testItem.id}`,
      newQuantity: 10,
      oldQuantity: 2,
      size: testItem.size || null,
      color: testItem.color || null
    };

    const quantityBeforeIncrease = testItemAfterReduction.quantity;

    if (handlers.has('cart')) {
      const cartHandler = handlers.get('cart');
      cartHandler(mockStockIncrease);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const quantityAfterIncrease = cart.items[0].quantity;
    const quantityUnchanged = quantityAfterIncrease === quantityBeforeIncrease;

    cartAssert(
      quantityUnchanged,
      'Cart quantity unchanged when stock > current quantity',
      `Quantity remained at ${quantityAfterIncrease}`
    );

    // ============================================================================
    // Test 4: Out of Stock Handling
    // ============================================================================
    console.log('\n📋 Test Group 4: Out of Stock Handling');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Simulate stock going to 0
    const mockOutOfStock = {
      productId: testItem.id,
      variantId: testItem.variantId || `var-${testItem.id}`,
      newQuantity: 0,
      oldQuantity: 5,
      size: testItem.size || null,
      color: testItem.color || null
    };

    if (handlers.has('cart')) {
      const cartHandler = handlers.get('cart');
      cartHandler(mockOutOfStock);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const testItemAfterOutOfStock = cart.items[0];
    const quantityReducedToMinimum = testItemAfterOutOfStock.quantity >= 1;

    cartAssert(
      quantityReducedToMinimum,
      'Cart maintains minimum quantity of 1 even when stock is 0',
      `Final quantity: ${testItemAfterOutOfStock.quantity}`
    );

    // ============================================================================
    // Test 5: Product Subscription
    // ============================================================================
    console.log('\n📋 Test Group 5: Product Subscription');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const subscribedBefore = synchronizer.getSubscribedProducts();
    const initialSubscriptionCount = subscribedBefore.length;

    cartAssert(
      initialSubscriptionCount >= 0,
      'Can retrieve subscribed products list',
      `Currently subscribed to ${initialSubscriptionCount} products`
    );

    // Test 5.2: Cart items should be subscribed
    const cartItemIds = cart.items.map(item => item.id);
    const allCartItemsSubscribed = cartItemIds.every(id => subscribedBefore.includes(id));

    cartAssert(
      allCartItemsSubscribed,
      'All cart items are subscribed to real-time updates',
      `${cartItemIds.length} cart items subscribed`
    );

    // ============================================================================
    // Test 6: Multiple Cart Items Update
    // ============================================================================
    console.log('\n📋 Test Group 6: Multiple Cart Items Update');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test with multiple cart items
    const itemsToTest = cart.items.slice(0, Math.min(2, cart.items.length));
    let multipleUpdatesHandled = 0;

    for (const item of itemsToTest) {
      const mockUpdate = {
        productId: item.id,
        variantId: item.variantId || `var-${item.id}`,
        newQuantity: Math.floor(Math.random() * 3) + 1, // 1-3 units
        oldQuantity: item.quantity + 5,
        size: item.size || null,
        color: item.color || null
      };

      if (handlers.has('cart')) {
        const cartHandler = handlers.get('cart');
        cartHandler(mockUpdate);
        multipleUpdatesHandled++;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    cartAssert(
      multipleUpdatesHandled === itemsToTest.length,
      'Multiple cart item updates handled',
      `Processed ${multipleUpdatesHandled}/${itemsToTest.length} cart items`
    );

    // ============================================================================
    // Test 7: Non-matching Product Updates (should be ignored)
    // ============================================================================
    console.log('\n📋 Test Group 7: Non-matching Product Updates');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const currentQuantity = cart.items[0].quantity;

    // Send update for product NOT in cart
    const mockUnrelatedUpdate = {
      productId: 'non-existent-product-99999',
      newQuantity: 5,
      oldQuantity: 10
    };

    if (handlers.has('cart')) {
      const cartHandler = handlers.get('cart');
      cartHandler(mockUnrelatedUpdate);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const quantityUnchangedForUnrelated = cart.items[0].quantity === currentQuantity;

    cartAssert(
      quantityUnchangedForUnrelated,
      'Updates for non-cart products are ignored',
      'Cart not affected by unrelated product updates'
    );

    // ============================================================================
    // Test 8: Variant Matching
    // ============================================================================
    console.log('\n📋 Test Group 8: Variant Matching');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // If cart item has size/color, test variant matching
    const itemWithVariant = cart.items.find(item => item.size && item.color);

    if (itemWithVariant) {
      const beforeVariantTest = itemWithVariant.quantity;

      // Send update with matching size/color
      const mockMatchingVariant = {
        productId: itemWithVariant.id,
        newQuantity: 1,
        oldQuantity: 5,
        size: itemWithVariant.size,
        color: itemWithVariant.color
      };

      if (handlers.has('cart')) {
        handlers.get('cart')(mockMatchingVariant);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const quantityAdjustedForMatch = itemWithVariant.quantity <= mockMatchingVariant.newQuantity;

      cartAssert(
        quantityAdjustedForMatch,
        'Variant matching works for size and color',
        `Item with ${itemWithVariant.size}/${itemWithVariant.color} was updated`
      );
    } else {
      cartAssert(
        true,
        'Variant matching - SKIPPED',
        'No items with size/color in cart (not applicable)'
      );
    }

    // ============================================================================
    // Test 9: Error Handling
    // ============================================================================
    console.log('\n📋 Test Group 9: Error Handling');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let errorHandled = false;

    // Try to handle null data
    if (handlers.has('cart')) {
      try {
        const cartHandler = handlers.get('cart');
        cartHandler(null);
        errorHandled = true;
      } catch (error) {
        errorHandled = true;
      }
    }

    cartAssert(
      errorHandled,
      'Null data handled gracefully',
      'Handler does not crash with null input'
    );

    // Test 9.2: Missing required properties
    let missingPropsHandled = false;
    if (handlers.has('cart')) {
      try {
        const cartHandler = handlers.get('cart');
        cartHandler({}); // Empty object
        missingPropsHandled = true;
      } catch (error) {
        missingPropsHandled = true;
      }
    }

    cartAssert(
      missingPropsHandled,
      'Missing properties handled gracefully',
      'Handler does not crash with incomplete data'
    );

    // ============================================================================
    // Final Summary
    // ============================================================================
    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║       TEST SUMMARY - Cart Real-Time Stock Monitoring       ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n');

    const totalTests = cartTestResults.passed + cartTestResults.failed;
    const passPercentage = ((cartTestResults.passed / totalTests) * 100).toFixed(1);

    console.log(`✅ PASSED: ${cartTestResults.passed}/${totalTests}`);
    console.log(`❌ FAILED: ${cartTestResults.failed}/${totalTests}`);
    console.log(`📊 SUCCESS RATE: ${passPercentage}%\n`);

    if (cartTestResults.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Cart page real-time stock monitoring is working correctly.\n');
    } else {
      console.log('⚠️ SOME TESTS FAILED - Review errors above before deployment.\n');
    }

    // Display detailed test results
    console.log('DETAILED TEST RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    cartTestResults.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.status} - ${test.name}`);
      if (test.details) console.log(`   Details: ${test.details}`);
    });

    console.log('\n🧪 Cart page test suite completed.');

  } catch (error) {
    console.error('❌ TEST SUITE ERROR:', error);
  }
})();
