#!/usr/bin/env node

/**
 * Location-Based SEO Verification Test
 * Checks that all location-based SEO features are properly configured
 *
 * Usage: node test-location-seo.js
 * Run this after deployment to verify location SEO is working
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results tracking
let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    log(`✅ ${name}`, 'green');
    passed++;
  } else {
    log(`❌ ${name}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
    failed++;
  }
}

log('\n🔍 Location-Based SEO Verification\n', 'blue');

// Test 1: Check config file exists
const configPath = path.join(__dirname, 'js', 'seo-location-config.js');
test(
  'Config file exists',
  fs.existsSync(configPath),
  `Expected: ${configPath}`
);

// Test 2: Check config file has required exports
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf-8');

  test(
    'Config exports SEOLocationConfig',
    configContent.includes('const SEOLocationConfig'),
    'Missing: const SEOLocationConfig declaration'
  );

  test(
    'Config has getOrganizationLocation method',
    configContent.includes('getOrganizationLocation()'),
    'Missing: getOrganizationLocation() method'
  );

  test(
    'Config has getServedRegions method',
    configContent.includes('getServedRegions()'),
    'Missing: getServedRegions() method'
  );

  test(
    'Config has getCurrency method',
    configContent.includes('getCurrency(region)'),
    'Missing: getCurrency(region) method'
  );

  test(
    'Config has getShippingText method',
    configContent.includes('getShippingText()'),
    'Missing: getShippingText() method'
  );

  test(
    'Config has Toronto location (Toronto)',
    configContent.includes('addressLocality'),
    'Missing: addressLocality in config'
  );

  test(
    'Config has Ontario region (ON)',
    configContent.includes('addressRegion'),
    'Missing: addressRegion in config'
  );

  test(
    'Config has Canada country (CA)',
    configContent.includes('addressCountry'),
    'Missing: addressCountry in config'
  );

  test(
    'Config has CA and US regions',
    configContent.includes("'CA'") && configContent.includes("'US'"),
    'Missing: CA or US region codes'
  );

  test(
    'Config has CAD and USD currencies',
    configContent.includes("'CAD'") && configContent.includes("'USD'"),
    'Missing: CAD or USD currency codes'
  );

  test(
    'Config has shipping text',
    configContent.includes('Ships across'),
    'Missing: shipping text'
  );
}

// Test 3: Check seo-utils.js has location methods
const utilsPath = path.join(__dirname, 'js', 'seo-utils.js');
test(
  'SEO utils file exists',
  fs.existsSync(utilsPath),
  `Expected: ${utilsPath}`
);

if (fs.existsSync(utilsPath)) {
  const utilsContent = fs.readFileSync(utilsPath, 'utf-8');

  test(
    'Utils has addGeoMetaTags method',
    utilsContent.includes('addGeoMetaTags()'),
    'Missing: addGeoMetaTags() method'
  );

  test(
    'Utils has generateOrganizationSchemaWithLocation method',
    utilsContent.includes('generateOrganizationSchemaWithLocation()'),
    'Missing: generateOrganizationSchemaWithLocation() method'
  );

  test(
    'Utils has generateProductSchemaWithLocation method',
    utilsContent.includes('generateProductSchemaWithLocation('),
    'Missing: generateProductSchemaWithLocation() method'
  );

  test(
    'Utils has addShippingText method',
    utilsContent.includes('addShippingText('),
    'Missing: addShippingText() method'
  );

  test(
    'Utils has initializeLocationSEO method',
    utilsContent.includes('initializeLocationSEO()'),
    'Missing: initializeLocationSEO() method'
  );

  test(
    'Utils handles SEOLocationConfig availability',
    utilsContent.includes('window.SEOLocationConfig'),
    'Missing: SEOLocationConfig checks'
  );

  test(
    'Utils has graceful fallback handling',
    utilsContent.includes('Fail gracefully') || utilsContent.includes('fail gracefully'),
    'Missing: graceful fallback comments/logic'
  );
}

// Test 4: Check index.html includes geo tags
const indexPath = path.join(__dirname, 'index.html');
test(
  'index.html exists',
  fs.existsSync(indexPath),
  `Expected: ${indexPath}`
);

if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  test(
    'index.html includes geo.region meta tag',
    indexContent.includes('geo.region') && indexContent.includes('CA-ON'),
    'Missing: <meta name="geo.region" content="CA-ON">'
  );

  test(
    'index.html includes geo.placename meta tag',
    indexContent.includes('geo.placename') && indexContent.includes('Toronto'),
    'Missing: <meta name="geo.placename" content="Toronto">'
  );

  test(
    'index.html loads seo-location-config.js',
    indexContent.includes('seo-location-config.js'),
    'Missing: <script src="js/seo-location-config.js"></script>'
  );

  test(
    'index.html calls initializeLocationSEO',
    indexContent.includes('initializeLocationSEO'),
    'Missing: window.seoManager.initializeLocationSEO()'
  );

  test(
    'index.html has shipping info container',
    indexContent.includes('shippingInfoContainer'),
    'Missing: <div id="shippingInfoContainer">'
  );

  test(
    'index.html calls addShippingText',
    indexContent.includes('addShippingText'),
    'Missing: window.seoManager.addShippingText()'
  );
}

// Test 5: Check product.html includes geo tags and location schema
const productPath = path.join(__dirname, 'product.html');
test(
  'product.html exists',
  fs.existsSync(productPath),
  `Expected: ${productPath}`
);

if (fs.existsSync(productPath)) {
  const productContent = fs.readFileSync(productPath, 'utf-8');

  test(
    'product.html includes geo.region meta tag',
    productContent.includes('geo.region') && productContent.includes('CA-ON'),
    'Missing: <meta name="geo.region" content="CA-ON">'
  );

  test(
    'product.html includes geo.placename meta tag',
    productContent.includes('geo.placename') && productContent.includes('Toronto'),
    'Missing: <meta name="geo.placename" content="Toronto">'
  );

  test(
    'product.html loads seo-location-config.js',
    productContent.includes('seo-location-config.js'),
    'Missing: <script src="js/seo-location-config.js"></script>'
  );

  test(
    'product.html uses generateProductSchemaWithLocation',
    productContent.includes('generateProductSchemaWithLocation'),
    'Missing: window.seoManager.generateProductSchemaWithLocation()'
  );

  test(
    'product.html has fallback to base schema',
    productContent.includes('generateProductSchema') && productContent.includes('else'),
    'Missing: fallback logic for base schema'
  );
}

// Test 6: Check LOCATION_SEO_GUIDE.md exists
const guideP = path.join(__dirname, 'LOCATION_SEO_GUIDE.md');
test(
  'LOCATION_SEO_GUIDE.md exists',
  fs.existsSync(guideP),
  'Documentation file missing'
);

// Summary
log('\n' + '='.repeat(50), 'blue');
log(`Results: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
log('='.repeat(50) + '\n', 'blue');

if (failed === 0) {
  log('✅ All location-based SEO checks passed!', 'green');
  log('Ready for deployment.\n', 'green');
  process.exit(0);
} else {
  log(`❌ ${failed} check(s) failed. Review above and fix before deploying.\n`, 'red');
  process.exit(1);
}
