const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testCartFunctionality() {
  console.log('🚀 Starting cart functionality tests...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions to see what's happening
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Track console messages and errors
  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
    console.log(`[CONSOLE ${msg.type()}] ${text}`);
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  const results = {
    navigationSuccess: false,
    shopPageAccessible: false,
    itemAddedToCart: false,
    cartBadgeUpdated: false,
    cartDrawerOpens: false,
    cartDrawerShowsItems: false,
    increaseQuantityWorks: false,
    decreaseQuantityWorks: false,
    removeItemWorks: false,
    consoleErrors: [],
    screenshots: []
  };

  try {
    // Step 1: Navigate to homepage
    console.log('📍 Step 1: Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    results.navigationSuccess = true;
    console.log('✅ Successfully navigated to homepage\n');

    // Take screenshot of homepage
    const homepageScreenshot = path.join(screenshotsDir, '1-homepage.png');
    await page.screenshot({ path: homepageScreenshot, fullPage: true });
    results.screenshots.push(homepageScreenshot);
    console.log(`📸 Screenshot saved: ${homepageScreenshot}\n`);

    // Step 2: Navigate to shop page
    console.log('📍 Step 2: Navigating to shop page');

    // Try to find and click shop link
    const shopLinkSelectors = [
      'a[href*="shop"]',
      'a:has-text("Shop")',
      'nav a:has-text("Shop")',
      '.nav-link:has-text("Shop")',
      'a.nav-item:has-text("Shop")'
    ];

    let shopLinkFound = false;
    for (const selector of shopLinkSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`Found shop link with selector: ${selector}`);
          await element.click();
          shopLinkFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!shopLinkFound) {
      // Try direct navigation
      console.log('Shop link not found, trying direct navigation to /shop.html');
      await page.goto('http://localhost:5173/shop.html', { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(1500);
    results.shopPageAccessible = true;
    console.log('✅ Successfully accessed shop page\n');

    // Take screenshot of shop page
    const shopPageScreenshot = path.join(screenshotsDir, '2-shop-page.png');
    await page.screenshot({ path: shopPageScreenshot, fullPage: true });
    results.screenshots.push(shopPageScreenshot);
    console.log(`📸 Screenshot saved: ${shopPageScreenshot}\n`);

    // Step 3: Add item to cart
    console.log('📍 Step 3: Adding item to cart');

    // Look for "Add to Cart" buttons
    const addToCartSelectors = [
      'button:has-text("Add to Cart")',
      'button:has-text("ADD TO CART")',
      '.add-to-cart',
      '[data-action="add-to-cart"]',
      'button.btn-primary:has-text("Add")'
    ];

    let addButtonClicked = false;
    for (const selector of addToCartSelectors) {
      try {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          console.log(`Found ${buttons.length} "Add to Cart" button(s) with selector: ${selector}`);
          console.log('Clicking first "Add to Cart" button...');
          await buttons[0].click();
          addButtonClicked = true;
          await page.waitForTimeout(1500);
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} failed: ${e.message}`);
      }
    }

    if (!addButtonClicked) {
      throw new Error('Could not find any "Add to Cart" button');
    }

    results.itemAddedToCart = true;
    console.log('✅ Clicked "Add to Cart" button\n');

    // Take screenshot after adding to cart
    const afterAddScreenshot = path.join(screenshotsDir, '3-after-add-to-cart.png');
    await page.screenshot({ path: afterAddScreenshot, fullPage: true });
    results.screenshots.push(afterAddScreenshot);
    console.log(`📸 Screenshot saved: ${afterAddScreenshot}\n`);

    // Step 4: Verify cart badge count
    console.log('📍 Step 4: Verifying cart badge count');

    const cartBadgeSelectors = [
      '.cart-badge',
      '[data-cart-count]',
      '.cart-count',
      '.badge',
      '.cart-icon .badge'
    ];

    let cartBadge = null;
    for (const selector of cartBadgeSelectors) {
      try {
        cartBadge = await page.$(selector);
        if (cartBadge) {
          const badgeText = await cartBadge.textContent();
          console.log(`Cart badge found with selector: ${selector}`);
          console.log(`Cart badge count: ${badgeText}`);
          results.cartBadgeUpdated = parseInt(badgeText) > 0;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (results.cartBadgeUpdated) {
      console.log('✅ Cart badge updated successfully\n');
    } else {
      console.log('⚠️  Cart badge not found or not updated\n');
    }

    // Step 5: Open cart drawer
    console.log('📍 Step 5: Opening cart drawer');

    const cartIconSelectors = [
      '.cart-icon',
      '[data-cart-toggle]',
      'button[aria-label*="cart"]',
      'button:has-text("Cart")',
      '.shopping-cart',
      '#cart-icon'
    ];

    let cartIconClicked = false;
    for (const selector of cartIconSelectors) {
      try {
        const cartIcon = await page.$(selector);
        if (cartIcon) {
          console.log(`Found cart icon with selector: ${selector}`);
          await cartIcon.click();
          cartIconClicked = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!cartIconClicked) {
      console.log('⚠️  Could not find cart icon to click\n');
    } else {
      console.log('✅ Clicked cart icon\n');
    }

    // Check if cart drawer is visible
    const cartDrawerSelectors = [
      '.cart-drawer',
      '.cart-panel',
      '[data-cart-drawer]',
      '#cart-drawer',
      '.cart-sidebar',
      '.offcanvas'
    ];

    let drawerVisible = false;
    for (const selector of cartDrawerSelectors) {
      try {
        const drawer = await page.$(selector);
        if (drawer) {
          const isVisible = await drawer.isVisible();
          if (isVisible) {
            console.log(`Cart drawer visible with selector: ${selector}`);
            results.cartDrawerOpens = true;
            drawerVisible = true;
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (results.cartDrawerOpens) {
      console.log('✅ Cart drawer opened successfully\n');
    } else {
      console.log('⚠️  Cart drawer not visible\n');
    }

    // Take screenshot of cart drawer
    const cartDrawerScreenshot = path.join(screenshotsDir, '4-cart-drawer-open.png');
    await page.screenshot({ path: cartDrawerScreenshot, fullPage: true });
    results.screenshots.push(cartDrawerScreenshot);
    console.log(`📸 Screenshot saved: ${cartDrawerScreenshot}\n`);

    // Step 6: Verify cart drawer shows items
    console.log('📍 Step 6: Verifying cart drawer shows items');

    const cartItemSelectors = [
      '.cart-item',
      '.cart-drawer .item',
      '[data-cart-item]',
      '.cart-product'
    ];

    let cartItems = [];
    for (const selector of cartItemSelectors) {
      try {
        cartItems = await page.$$(selector);
        if (cartItems.length > 0) {
          console.log(`Found ${cartItems.length} item(s) in cart with selector: ${selector}`);
          results.cartDrawerShowsItems = true;

          // Get item details
          for (let i = 0; i < cartItems.length; i++) {
            const itemText = await cartItems[i].textContent();
            console.log(`Item ${i + 1}: ${itemText.trim().substring(0, 100)}...`);
          }
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (results.cartDrawerShowsItems) {
      console.log('✅ Cart drawer shows items correctly\n');
    } else {
      console.log('⚠️  No items found in cart drawer\n');
    }

    // Step 7: Test increase quantity
    console.log('📍 Step 7: Testing increase quantity button');

    const increaseButtonSelectors = [
      'button:has-text("+")',
      '.quantity-increase',
      '[data-action="increase"]',
      'button.increase-qty',
      '.qty-btn.plus'
    ];

    let increaseButtonClicked = false;
    let quantityBeforeIncrease = null;

    // Try to get current quantity
    const quantitySelectors = [
      '.quantity',
      '.qty',
      'input[type="number"]',
      '[data-quantity]'
    ];

    for (const selector of quantitySelectors) {
      try {
        const qtyElement = await page.$(selector);
        if (qtyElement) {
          quantityBeforeIncrease = await qtyElement.inputValue() || await qtyElement.textContent();
          console.log(`Current quantity: ${quantityBeforeIncrease}`);
          break;
        }
      } catch (e) {
        // Try next
      }
    }

    for (const selector of increaseButtonSelectors) {
      try {
        const increaseButtons = await page.$$(selector);
        if (increaseButtons.length > 0) {
          console.log(`Found increase button with selector: ${selector}`);
          await increaseButtons[0].click();
          increaseButtonClicked = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (increaseButtonClicked) {
      // Check if quantity increased
      for (const selector of quantitySelectors) {
        try {
          const qtyElement = await page.$(selector);
          if (qtyElement) {
            const quantityAfterIncrease = await qtyElement.inputValue() || await qtyElement.textContent();
            console.log(`Quantity after increase: ${quantityAfterIncrease}`);
            if (quantityBeforeIncrease && parseInt(quantityAfterIncrease) > parseInt(quantityBeforeIncrease)) {
              results.increaseQuantityWorks = true;
            }
            break;
          }
        } catch (e) {
          // Try next
        }
      }
    }

    if (results.increaseQuantityWorks) {
      console.log('✅ Increase quantity button works\n');
    } else {
      console.log('⚠️  Could not verify increase quantity functionality\n');
    }

    // Take screenshot after increasing quantity
    const afterIncreaseScreenshot = path.join(screenshotsDir, '5-after-increase-qty.png');
    await page.screenshot({ path: afterIncreaseScreenshot, fullPage: true });
    results.screenshots.push(afterIncreaseScreenshot);
    console.log(`📸 Screenshot saved: ${afterIncreaseScreenshot}\n`);

    // Step 8: Test decrease quantity
    console.log('📍 Step 8: Testing decrease quantity button');

    const decreaseButtonSelectors = [
      'button:has-text("-")',
      '.quantity-decrease',
      '[data-action="decrease"]',
      'button.decrease-qty',
      '.qty-btn.minus'
    ];

    let decreaseButtonClicked = false;
    let quantityBeforeDecrease = null;

    // Get current quantity
    for (const selector of quantitySelectors) {
      try {
        const qtyElement = await page.$(selector);
        if (qtyElement) {
          quantityBeforeDecrease = await qtyElement.inputValue() || await qtyElement.textContent();
          console.log(`Current quantity: ${quantityBeforeDecrease}`);
          break;
        }
      } catch (e) {
        // Try next
      }
    }

    for (const selector of decreaseButtonSelectors) {
      try {
        const decreaseButtons = await page.$$(selector);
        if (decreaseButtons.length > 0) {
          console.log(`Found decrease button with selector: ${selector}`);
          await decreaseButtons[0].click();
          decreaseButtonClicked = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (decreaseButtonClicked) {
      // Check if quantity decreased
      for (const selector of quantitySelectors) {
        try {
          const qtyElement = await page.$(selector);
          if (qtyElement) {
            const quantityAfterDecrease = await qtyElement.inputValue() || await qtyElement.textContent();
            console.log(`Quantity after decrease: ${quantityAfterDecrease}`);
            if (quantityBeforeDecrease && parseInt(quantityAfterDecrease) < parseInt(quantityBeforeDecrease)) {
              results.decreaseQuantityWorks = true;
            }
            break;
          }
        } catch (e) {
          // Try next
        }
      }
    }

    if (results.decreaseQuantityWorks) {
      console.log('✅ Decrease quantity button works\n');
    } else {
      console.log('⚠️  Could not verify decrease quantity functionality\n');
    }

    // Take screenshot after decreasing quantity
    const afterDecreaseScreenshot = path.join(screenshotsDir, '6-after-decrease-qty.png');
    await page.screenshot({ path: afterDecreaseScreenshot, fullPage: true });
    results.screenshots.push(afterDecreaseScreenshot);
    console.log(`📸 Screenshot saved: ${afterDecreaseScreenshot}\n`);

    // Step 9: Test remove item
    console.log('📍 Step 9: Testing remove item button');

    const removeButtonSelectors = [
      'button:has-text("Remove")',
      'button:has-text("×")',
      '.remove-item',
      '[data-action="remove"]',
      'button.btn-remove',
      '.delete-btn'
    ];

    let removeButtonClicked = false;
    let itemCountBefore = cartItems.length;

    for (const selector of removeButtonSelectors) {
      try {
        const removeButtons = await page.$$(selector);
        if (removeButtons.length > 0) {
          console.log(`Found remove button with selector: ${selector}`);
          await removeButtons[0].click();
          removeButtonClicked = true;
          await page.waitForTimeout(1500);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (removeButtonClicked) {
      // Check if item was removed
      for (const selector of cartItemSelectors) {
        try {
          const itemsAfterRemove = await page.$$(selector);
          console.log(`Items in cart after remove: ${itemsAfterRemove.length}`);
          if (itemsAfterRemove.length < itemCountBefore) {
            results.removeItemWorks = true;
          }
          break;
        } catch (e) {
          // Try next
        }
      }

      // Also check if cart shows empty state
      const emptyCartSelectors = [
        ':has-text("empty")',
        ':has-text("no items")',
        '.empty-cart'
      ];

      for (const selector of emptyCartSelectors) {
        try {
          const emptyMessage = await page.$(selector);
          if (emptyMessage && await emptyMessage.isVisible()) {
            console.log('Empty cart message found');
            results.removeItemWorks = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }

    if (results.removeItemWorks) {
      console.log('✅ Remove item button works\n');
    } else {
      console.log('⚠️  Could not verify remove item functionality\n');
    }

    // Take screenshot after removing item
    const afterRemoveScreenshot = path.join(screenshotsDir, '7-after-remove-item.png');
    await page.screenshot({ path: afterRemoveScreenshot, fullPage: true });
    results.screenshots.push(afterRemoveScreenshot);
    console.log(`📸 Screenshot saved: ${afterRemoveScreenshot}\n`);

    // Collect console errors
    results.consoleErrors = consoleErrors;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    results.error = error.message;

    // Take error screenshot
    try {
      const errorScreenshot = path.join(screenshotsDir, 'error-state.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      results.screenshots.push(errorScreenshot);
      console.log(`📸 Error screenshot saved: ${errorScreenshot}\n`);
    } catch (e) {
      // Ignore screenshot errors
    }
  } finally {
    await browser.close();
  }

  return results;
}

// Run the tests
(async () => {
  const results = await testCartFunctionality();

  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log(`✅ Navigation to homepage: ${results.navigationSuccess ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Shop page accessible: ${results.shopPageAccessible ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Item added to cart: ${results.itemAddedToCart ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Cart badge updated: ${results.cartBadgeUpdated ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Cart drawer opens: ${results.cartDrawerOpens ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Cart drawer shows items: ${results.cartDrawerShowsItems ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Increase quantity works: ${results.increaseQuantityWorks ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Decrease quantity works: ${results.decreaseQuantityWorks ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Remove item works: ${results.removeItemWorks ? 'PASS' : 'FAIL'}`);

  console.log(`\n📊 Console Errors: ${results.consoleErrors.length}`);
  if (results.consoleErrors.length > 0) {
    console.log('\nConsole Errors:');
    results.consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  console.log(`\n📸 Screenshots saved: ${results.screenshots.length}`);
  results.screenshots.forEach((screenshot, index) => {
    console.log(`  ${index + 1}. ${screenshot}`);
  });

  if (results.error) {
    console.log(`\n❌ Fatal Error: ${results.error}`);
  }

  console.log('\n' + '='.repeat(80));

  // Calculate pass rate
  const tests = [
    results.navigationSuccess,
    results.shopPageAccessible,
    results.itemAddedToCart,
    results.cartBadgeUpdated,
    results.cartDrawerOpens,
    results.cartDrawerShowsItems,
    results.increaseQuantityWorks,
    results.decreaseQuantityWorks,
    results.removeItemWorks
  ];

  const passedTests = tests.filter(t => t).length;
  const totalTests = tests.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`\n🎯 Overall Pass Rate: ${passedTests}/${totalTests} (${passRate}%)\n`);

  // Save results to JSON file
  const resultsPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed results saved to: ${resultsPath}\n`);
})();
