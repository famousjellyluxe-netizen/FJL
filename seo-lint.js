#!/usr/bin/env node

/**
 * SEO Lint Script for FJL
 * Checks key pages for critical SEO elements
 *
 * Usage:
 *   node seo-lint.js [--skip-external] [--verbose]
 *
 * Exit codes:
 *   0 = All checks passed
 *   1 = One or more checks failed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'node-html-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKIP_EXTERNAL = process.argv.includes('--skip-external');
const VERBOSE = process.argv.includes('--verbose');

// Pages to check
const PAGES_TO_CHECK = [
  'index.html',
  'shop.html',
  'about.html',
  'contact.html',
  'product.html'
];

// Critical SEO elements that must be present
const CRITICAL_CHECKS = {
  title: 'Page title must be present',
  metaDescription: 'Meta description must be present',
  ogTitle: 'OpenGraph title must be present',
  ogDescription: 'OpenGraph description must be present',
  h1: 'Page must have exactly one H1 tag'
};

// Important (non-critical) checks
const IMPORTANT_CHECKS = {
  ogImage: 'OpenGraph image should be present',
  canonical: 'Canonical URL should be present',
  ogType: 'OpenGraph type should be present',
  twitterCard: 'Twitter card metadata should be present',
  imageLazyLoading: 'Images should have loading="lazy"',
  imageAlt: 'Images should have alt text'
};

/**
 * Parse HTML file
 */
function parseHTML(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parse(content);
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract meta tag content
 */
function getMetaContent(root, name, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  try {
    const element = root.querySelector(selector);
    return element ? element.getAttribute('content') : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check critical SEO elements
 */
function checkCriticalElements(root, filePath) {
  const results = {
    passed: [],
    failed: []
  };

  // Check title
  const title = root.querySelector('title');
  if (title && title.textContent.trim()) {
    results.passed.push('✅ title');
  } else {
    results.failed.push('❌ title: ' + CRITICAL_CHECKS.title);
  }

  // Check meta description
  const description = getMetaContent(root, 'description');
  if (description) {
    results.passed.push('✅ meta description');
  } else {
    results.failed.push('❌ meta description: ' + CRITICAL_CHECKS.metaDescription);
  }

  // Check OG title
  const ogTitle = getMetaContent(root, 'og:title', true);
  if (ogTitle) {
    results.passed.push('✅ og:title');
  } else {
    results.failed.push('❌ og:title: ' + CRITICAL_CHECKS.ogTitle);
  }

  // Check OG description
  const ogDesc = getMetaContent(root, 'og:description', true);
  if (ogDesc) {
    results.passed.push('✅ og:description');
  } else {
    results.failed.push('❌ og:description: ' + CRITICAL_CHECKS.ogDescription);
  }

  // Check H1 count
  const h1s = root.querySelectorAll('h1');
  if (h1s.length === 1) {
    results.passed.push('✅ h1 (exactly one)');
  } else {
    results.failed.push(`❌ h1: Found ${h1s.length}, expected 1 (${CRITICAL_CHECKS.h1})`);
  }

  return results;
}

/**
 * Check important but non-critical elements
 */
function checkImportantElements(root) {
  const results = {
    passed: [],
    warnings: []
  };

  // Check OG image
  const ogImage = getMetaContent(root, 'og:image', true);
  if (ogImage) {
    results.passed.push('✅ og:image');
  } else {
    results.warnings.push('⚠️  og:image: ' + IMPORTANT_CHECKS.ogImage);
  }

  // Check canonical
  const canonical = root.querySelector('link[rel="canonical"]');
  if (canonical) {
    results.passed.push('✅ canonical');
  } else {
    results.warnings.push('⚠️  canonical: ' + IMPORTANT_CHECKS.canonical);
  }

  // Check OG type
  const ogType = getMetaContent(root, 'og:type', true);
  if (ogType) {
    results.passed.push('✅ og:type');
  } else {
    results.warnings.push('⚠️  og:type: ' + IMPORTANT_CHECKS.ogType);
  }

  // Check Twitter card
  const twitterCard = getMetaContent(root, 'twitter:card', true);
  if (twitterCard) {
    results.passed.push('✅ twitter:card');
  } else {
    results.warnings.push('⚠️  twitter:card: ' + IMPORTANT_CHECKS.twitterCard);
  }

  // Check image loading
  const images = root.querySelectorAll('img');
  const lazyLoadedImages = Array.from(images).filter(img => {
    const loading = img.getAttribute('loading');
    return loading === 'lazy' || img.getAttribute('src')?.includes('placeholder');
  });

  if (lazyLoadedImages.length === images.length) {
    results.passed.push('✅ image lazy loading');
  } else {
    results.warnings.push(`⚠️  image lazy loading: ${lazyLoadedImages.length}/${images.length} images (${IMPORTANT_CHECKS.imageLazyLoading})`);
  }

  // Check alt text
  const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
  if (imagesWithoutAlt.length === 0) {
    results.passed.push('✅ image alt text');
  } else {
    results.warnings.push(`⚠️  image alt text: ${imagesWithoutAlt.length} images missing alt (${IMPORTANT_CHECKS.imageAlt})`);
  }

  return results;
}

/**
 * Lint a single page
 */
function lintPage(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Checking ${fileName}...`);

  const root = parseHTML(filePath);
  if (!root) {
    return false;
  }

  const critical = checkCriticalElements(root, filePath);
  const important = checkImportantElements(root);

  // Print results
  if (VERBOSE) {
    console.log('\n  Critical Checks:');
    critical.passed.forEach(p => console.log(`    ${p}`));
    critical.failed.forEach(f => console.log(`    ${f}`));
  }

  if (critical.failed.length > 0) {
    critical.failed.forEach(f => console.log(`    ${f}`));
    return false;
  }

  if (VERBOSE) {
    console.log('\n  Important Checks:');
    important.passed.forEach(p => console.log(`    ${p}`));
    important.warnings.forEach(w => console.log(`    ${w}`));
  } else if (important.warnings.length > 0) {
    important.warnings.forEach(w => console.log(`    ${w}`));
  }

  console.log(`  ✅ ${fileName} passed`);
  return true;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Running SEO lint checks...\n');

  let passCount = 0;
  let failCount = 0;

  for (const page of PAGES_TO_CHECK) {
    const filePath = path.join(__dirname, page);

    if (!fs.existsSync(filePath)) {
      if (VERBOSE) {
        console.log(`⏭️  Skipping ${page} (not found)`);
      }
      continue;
    }

    const passed = lintPage(filePath);
    if (passed) {
      passCount++;
    } else {
      failCount++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n❌ SEO lint failed. Fix the errors above and try again.');
    process.exit(1);
  } else {
    console.log('\n✅ All SEO checks passed!');
    process.exit(0);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { lintPage, checkCriticalElements, checkImportantElements };
