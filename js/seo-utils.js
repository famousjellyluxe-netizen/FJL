/**
 * SEO Utilities for FJL Clothing
 * Handles metadata generation, JSON-LD schema, and SEO-related DOM manipulation
 */

class SEOManager {
  constructor() {
    this.isDev = this._isDevelopmentEnvironment();
  }

  /**
   * Check if we're in a development environment
   */
  _isDevelopmentEnvironment() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168');
  }

  /**
   * Set page title and meta description
   * @param {Object} config - { title, description, url, image, ogType }
   */
  setPageMetadata(config) {
    const {
      title,
      description,
      url = window.location.href,
      image = '/images/og-default.jpg',
      ogType = 'website'
    } = config;

    // Set page title
    if (title) {
      document.title = title;
      this._setMetaTag('og:title', title);
      this._setMetaTag('twitter:title', title);
    }

    // Set meta description
    if (description) {
      this._setMetaTag('description', description);
      this._setMetaTag('og:description', description);
      this._setMetaTag('twitter:description', description);
    }

    // Set canonical URL
    if (url) {
      this._setCanonicalLink(url);
      this._setMetaTag('og:url', url);
    }

    // Set OG image
    if (image) {
      this._setMetaTag('og:image', image);
      this._setMetaTag('og:image:width', '1200');
      this._setMetaTag('og:image:height', '630');
      this._setMetaTag('twitter:image', image);
    }

    // Set OG type
    this._setMetaTag('og:type', ogType);

    // Set Twitter card type
    this._setMetaTag('twitter:card', 'summary_large_image');

    // Add noindex for development environments
    if (this.isDev) {
      this._setMetaTag('robots', 'noindex, nofollow');
    }
  }

  /**
   * Set or update a meta tag
   * @param {string} name - Meta tag name (og:title, description, etc.)
   * @param {string} content - Meta tag content
   */
  _setMetaTag(name, content) {
    let selector, attrName;

    // Determine if we're setting property (og:) or name attribute
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      selector = `meta[property="${name}"]`;
      attrName = 'property';
    } else {
      selector = `meta[name="${name}"]`;
      attrName = 'name';
    }

    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, name);
      document.head.appendChild(element);
    }
    element.content = content;
  }

  /**
   * Set canonical link
   */
  _setCanonicalLink(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  /**
   * Add JSON-LD structured data to page
   * @param {Object} schema - JSON-LD schema object
   * @param {string} type - Type identifier for the script (optional)
   */
  addJSONLD(schema, type = 'schema') {
    let script = document.querySelector(`script[data-seo-type="${type}"]`);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-type', type);
      document.head.appendChild(script);
    }
    script.innerHTML = JSON.stringify(schema);
  }

  /**
   * Generate Organization schema
   */
  generateOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'FJL - Famous Jolly Luxe',
      'description': 'Premium streetwear fashion brand',
      'url': window.location.origin,
      'logo': `${window.location.origin}/fjl-logo-favicon.svg`,
      'sameAs': [
        'https://www.instagram.com/snug_worldd',
        'https://wa.me/2347078939461'
      ],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'Customer Service',
        'email': 'support@fjlclothing.shop'
      }
    };
  }

  /**
   * Generate Website schema
   */
  generateWebsiteSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Website',
      'name': 'FJL - Famous Jolly Luxe',
      'url': window.location.origin,
      'searchAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `${window.location.origin}/shop.html?search={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };
  }

  /**
   * Generate Product schema
   * @param {Object} product - Product object from API
   */
  generateProductSchema(product) {
    if (!product) return null;

    const availability = product.total_stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'description': product.description || product.name,
      'sku': product.sku || product.id,
      'url': window.location.href,
      'image': product.image_url || product.image || `${window.location.origin}/images/placeholder.png`,
      'brand': {
        '@type': 'Brand',
        'name': 'FJL - Famous Jolly Luxe'
      },
      'offers': {
        '@type': 'Offer',
        'url': window.location.href,
        'priceCurrency': 'CAD',
        'price': product.price.toString(),
        'availability': availability,
        'seller': {
          '@type': 'Organization',
          'name': 'FJL - Famous Jolly Luxe'
        }
      }
    };
  }

  /**
   * Generate BreadcrumbList schema
   * @param {Array} breadcrumbs - Array of { name, url }
   */
  generateBreadcrumbSchema(breadcrumbs) {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url
      }))
    };
  }

  /**
   * Set responsive image with srcset
   * @param {HTMLImageElement} img - Image element
   * @param {string} src - Base image src
   * @param {string} alt - Alt text
   */
  setResponsiveImage(img, src, alt) {
    if (!img) return;

    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';

    // Add srcset for responsive images (assuming CDN supports ?w= parameter)
    if (src && !src.includes('placeholder')) {
      img.srcSet = `
        ${src}?w=400 400w,
        ${src}?w=600 600w,
        ${src}?w=800 800w,
        ${src}?w=1200 1200w
      `.trim();
      img.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }
  }

  /**
   * Add preconnect and prefetch links for performance
   */
  addPerformanceHints() {
    const origins = [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      { rel: 'dns-prefetch', href: 'https://cdn.tailwindcss.com' }
    ];

    origins.forEach(({ rel, href }) => {
      if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (rel === 'preconnect') link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Ensure page has exactly one H1
   * @returns {boolean} - True if valid
   */
  validateHeadingStructure() {
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) {
      console.warn('⚠️  SEO: Page has no H1 tag');
      return false;
    }
    if (h1s.length > 1) {
      console.warn('⚠️  SEO: Page has multiple H1 tags');
      return false;
    }
    return true;
  }

  /**
   * Validate critical SEO elements on page
   * @returns {Object} - Validation results
   */
  validateSEOElements() {
    const results = {
      hasTitle: !!document.title,
      hasMetaDescription: !!document.querySelector('meta[name="description"]'),
      hasOGTitle: !!document.querySelector('meta[property="og:title"]'),
      hasOGDescription: !!document.querySelector('meta[property="og:description"]'),
      hasOGImage: !!document.querySelector('meta[property="og:image"]'),
      hasCanonical: !!document.querySelector('link[rel="canonical"]'),
      hasH1: document.querySelectorAll('h1').length === 1,
      allImagesHaveAlt: Array.from(document.querySelectorAll('img')).every(img => img.alt)
    };

    results.isValid = Object.values(results).every(v => v === true);
    return results;
  }

  /**
   * Add geographic meta tags (geo.region, geo.placename)
   * Signals geographic focus to search engines
   */
  addGeoMetaTags() {
    if (typeof window === 'undefined' || !window.SEOLocationConfig) {
      return; // Fail gracefully if config not available
    }

    const geoMeta = window.SEOLocationConfig.getGeoMeta();

    if (geoMeta.region) {
      this._setMetaTag('geo.region', geoMeta.region);
    }

    if (geoMeta.placename) {
      this._setMetaTag('geo.placename', geoMeta.placename);
    }
  }

  /**
   * Generate Organization schema with geographic location
   * Extends base Organization schema with address information
   */
  generateOrganizationSchemaWithLocation() {
    const baseSchema = this.generateOrganizationSchema();

    // Add location if config available
    if (typeof window !== 'undefined' && window.SEOLocationConfig) {
      const location = window.SEOLocationConfig.getOrganizationLocation();
      if (location) {
        baseSchema.address = {
          '@type': 'PostalAddress',
          'addressLocality': location.addressLocality,
          'addressRegion': location.addressRegion,
          'addressCountry': location.addressCountry
        };
      }
    }

    return baseSchema;
  }

  /**
   * Generate Product schema with geographic areaServed
   * Extends Product schema with regions and dynamic currency
   * @param {Object} product - Product object from API
   * @param {string} region - Optional region code (CA, US, etc.)
   */
  generateProductSchemaWithLocation(product, region = null) {
    if (!product) return null;

    const baseSchema = this.generateProductSchema(product);

    // Determine currency based on region
    let currency = 'CAD'; // Default
    if (typeof window !== 'undefined' && window.SEOLocationConfig) {
      currency = window.SEOLocationConfig.getCurrency(region);
      const servedRegions = window.SEOLocationConfig.getServedRegions();

      // Add areaServed to offers
      if (baseSchema.offers && servedRegions && servedRegions.length > 0) {
        baseSchema.offers.areaServed = servedRegions;
      }

      // Update currency in offers (override hardcoded CAD)
      if (baseSchema.offers) {
        baseSchema.offers.priceCurrency = currency;
      }
    }

    return baseSchema;
  }

  /**
   * Add shipping information to page footer or target element
   * @param {HTMLElement} targetElement - Element to insert shipping text (optional)
   * @returns {string} - Shipping text for manual insertion
   */
  addShippingText(targetElement = null) {
    if (typeof window === 'undefined' || !window.SEOLocationConfig) {
      return ''; // Fail gracefully
    }

    const shippingText = window.SEOLocationConfig.getShippingText();

    if (!shippingText) {
      return '';
    }

    // If target element provided, insert text
    if (targetElement) {
      const shippingElement = document.createElement('div');
      shippingElement.className = 'seo-shipping-text';
      shippingElement.setAttribute('data-seo-type', 'shipping-info');
      shippingElement.textContent = shippingText;
      targetElement.appendChild(shippingElement);
    }

    return shippingText;
  }

  /**
   * Initialize all location-based SEO enhancements
   * Call this once per page load to apply all geographic optimizations
   */
  initializeLocationSEO() {
    try {
      // Add geographic meta tags
      this.addGeoMetaTags();

      // Update Organization schema with location
      const orgSchema = this.generateOrganizationSchemaWithLocation();
      this.addJSONLD(orgSchema, 'organization');

      console.log('✅ Location-based SEO initialized (geo meta tags, Organization schema updated)');
    } catch (error) {
      console.warn('⚠️  Error initializing location SEO:', error.message);
      // Fail gracefully - don't break page if location SEO setup fails
    }
  }
}

// Export for use in both browser and Node.js environments
if (typeof window !== 'undefined') {
  window.seoManager = new SEOManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SEOManager;
}
