/**
 * FJL Sitemap Generator
 * Generates sitemap.xml including all static pages and admin-created products
 *
 * Usage:
 *   node sitemap-generator.js          (generates from backend API)
 *   node sitemap-generator.js --local  (uses local JSON cache)
 *
 * This script should be run:
 * - During build process
 * - When products are added/updated/deleted (via webhook or scheduled job)
 * - Manually by admin
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const SITE_URL = process.env.SITE_URL || 'https://fjlclothing.shop';
const API_URL = process.env.API_URL || 'http://localhost:5001/api';
const USE_LOCAL_CACHE = process.argv.includes('--local');

// Static pages that are always included
const STATIC_PAGES = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: '1.0'
  },
  {
    url: '/shop.html',
    changefreq: 'daily',
    priority: '0.9'
  },
  {
    url: '/about.html',
    changefreq: 'monthly',
    priority: '0.7'
  },
  {
    url: '/contact.html',
    changefreq: 'monthly',
    priority: '0.6'
  },
  {
    url: '/privacy-policy.html',
    changefreq: 'yearly',
    priority: '0.3'
  },
  {
    url: '/refund-policy.html',
    changefreq: 'yearly',
    priority: '0.3'
  },
  {
    url: '/shipping-policy.html',
    changefreq: 'yearly',
    priority: '0.3'
  },
  {
    url: '/terms-of-service.html',
    changefreq: 'yearly',
    priority: '0.3'
  }
];

/**
 * Fetch products from API
 */
async function fetchProductsFromAPI() {
  try {
    console.log(`📡 Fetching products from ${API_URL}/products...`);

    const response = await fetch(`${API_URL}/products?limit=1000&is_active=true`, {
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract products array from response
    let products = [];
    if (data.success && data.data) {
      if (Array.isArray(data.data.data)) {
        products = data.data.data;
      } else if (Array.isArray(data.data)) {
        products = data.data;
      }
    }

    console.log(`✅ Fetched ${products.length} products from API`);
    return products;
  } catch (error) {
    console.error('❌ Error fetching from API:', error.message);
    return null;
  }
}

/**
 * Load products from local cache
 */
function loadProductsFromCache() {
  const cacheFile = path.join(__dirname, 'products-cache.json');

  if (!fs.existsSync(cacheFile)) {
    console.warn('⚠️  No local cache found at', cacheFile);
    return [];
  }

  try {
    const data = fs.readFileSync(cacheFile, 'utf-8');
    const products = JSON.parse(data);
    console.log(`📦 Loaded ${products.length} products from cache`);
    return products;
  } catch (error) {
    console.error('❌ Error loading cache:', error.message);
    return [];
  }
}

/**
 * Get products (from API or cache)
 */
async function getProducts() {
  if (USE_LOCAL_CACHE) {
    return loadProductsFromCache();
  }

  const apiProducts = await fetchProductsFromAPI();
  if (apiProducts && apiProducts.length > 0) {
    // Save to cache for offline use
    try {
      fs.writeFileSync(
        path.join(__dirname, 'products-cache.json'),
        JSON.stringify(apiProducts, null, 2)
      );
      console.log('💾 Saved products to cache');
    } catch (error) {
      console.warn('⚠️  Could not save cache:', error.message);
    }
    return apiProducts;
  }

  // Fallback to cache if API fails
  console.log('⚠️  Falling back to local cache...');
  return loadProductsFromCache();
}

/**
 * Generate sitemap XML content
 */
function generateSitemapXML(pages) {
  const urls = pages.map(page => {
    return `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Main function to generate sitemap
 */
async function generateSitemap() {
  try {
    console.log('🔧 Generating sitemap.xml...');
    console.log(`📍 Site URL: ${SITE_URL}`);

    // Get products from API or cache
    const products = await getProducts();

    // Build page list
    let pages = [...STATIC_PAGES];

    // Add product pages
    if (products && products.length > 0) {
      const productPages = products
        .filter(p => p.id)
        .map(p => ({
          url: `/product.html?id=${p.id}`,
          changefreq: 'weekly',
          priority: '0.8'
        }));

      pages = pages.concat(productPages);
      console.log(`🛍️  Added ${productPages.length} product pages`);
    }

    // Generate XML
    const sitemapContent = generateSitemapXML(pages);

    // Write to file
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent);

    console.log(`✅ Sitemap generated: ${sitemapPath}`);
    console.log(`📄 Total pages: ${pages.length}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run generator if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemap().then(() => {
    console.log('✨ Done!');
  });
}

export { generateSitemap, getProducts, generateSitemapXML };
