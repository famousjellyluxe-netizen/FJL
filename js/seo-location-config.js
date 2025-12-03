/**
 * Location & Geographic SEO Configuration for FJL Clothing
 * Centralizes shipping, location, and regional settings
 *
 * This file is environment-safe and can be updated without modifying templates
 */

const SEOLocationConfig = {
  /**
   * Primary business location
   * These values appear in Organization JSON-LD schema
   */
  organization: {
    location: {
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA'
    }
  },

  /**
   * Shipping regions
   * Displayed in product pages and footer
   */
  shipping: {
    regions: ['CA', 'US'],
    primaryRegion: 'CA',
    secondaryRegions: ['US'],
    // Friendly text for footer (non-hardcoded, configurable)
    shippingText: 'Ships across Canada and USA.'
  },

  /**
   * Price currency by region
   * Maps region code to currency
   * Defaults to CAD if region not found
   */
  currencyByRegion: {
    CA: 'CAD',
    US: 'USD'
  },

  /**
   * Default currency (used when region unknown)
   */
  defaultCurrency: 'CAD',

  /**
   * Geographic meta tags (for search engines)
   * Used in <meta name="geo.region"> and <meta name="geo.placename">
   */
  geoMeta: {
    region: 'CA-ON',
    placename: 'Toronto'
  },

  /**
   * Get currency for a region
   * @param {string} region - Region code (CA, US, etc.)
   * @returns {string} - Currency code (CAD, USD, etc.)
   */
  getCurrency(region) {
    if (!region) return this.defaultCurrency;
    return this.currencyByRegion[region] || this.defaultCurrency;
  },

  /**
   * Get shipping text
   * @returns {string} - Shipping text for footer
   */
  getShippingText() {
    return this.shipping.shippingText;
  },

  /**
   * Get served regions
   * @returns {Array} - Array of region codes (e.g., ['CA', 'US'])
   */
  getServedRegions() {
    return this.shipping.regions;
  },

  /**
   * Get organization location
   * @returns {Object} - Location object with addressLocality, addressRegion, addressCountry
   */
  getOrganizationLocation() {
    return this.organization.location;
  },

  /**
   * Get geo meta tags
   * @returns {Object} - Object with region and placename
   */
  getGeoMeta() {
    return this.geoMeta;
  }
};

// Export for use in both browser and Node.js environments
if (typeof window !== 'undefined') {
  window.SEOLocationConfig = SEOLocationConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SEOLocationConfig;
}
