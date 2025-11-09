import { supabase } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Cache for settings (update every 5 minutes)
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all business settings with caching
 * Reads from the settings table (key-value format)
 */
export async function getSettings() {
  // Check if cache is still valid
  if (settingsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('📦 Using cached settings');
    return settingsCache;
  }

  try {
    // Fetch all settings from the key-value table
    const { data: settingsData, error } = await supabase
      .from('store_settings')
      .select('setting_key, setting_value, setting_type');

    if (error) {
      console.error('Error fetching settings:', error);
      return getDefaultSettings();
    }

    // Convert array of key-value pairs to object
    const settings = {};

    if (settingsData && Array.isArray(settingsData)) {
      settingsData.forEach(row => {
        const key = row.setting_key;
        let value = row.setting_value;

        // Convert value based on type
        if (row.setting_type === 'number') {
          value = parseFloat(value);
        } else if (row.setting_type === 'json') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn(`Failed to parse JSON for ${key}:`, value);
          }
        }

        settings[key] = value;
      });
    }

    // Map to expected field names
    const mappedSettings = {
      // Bank account details (fallback for email if not set)
      account_name: settings.store_name || 'Famous Jelly Luxe',
      bank_name: settings.bank_name || 'Access Bank',
      account_number: settings.account_number || '1770816426',
      account_type: settings.account_type || 'Business Account',
      store_email: settings.store_email || 'hello@fjlclothing.shop',

      // Store settings
      tax_rate: settings.tax_rate ? parseFloat(settings.tax_rate) : 7.5,
      shipping_cost: settings.shipping_cost ? parseFloat(settings.shipping_cost) : 0,
      currency: settings.store_currency || 'NGN',
      currency_symbol: settings.currency_symbol || '₦',
      store_name: settings.store_name || '',
      business_name: settings.business_name || '',
      store_phone: settings.store_phone || '',
      store_address: settings.store_address || '',

      // Email settings
      delivery_days: settings.delivery_days ? parseInt(settings.delivery_days) : 5
    };

    // Update cache
    settingsCache = mappedSettings;
    cacheTimestamp = Date.now();

    console.log('✅ Settings loaded from database');
    return mappedSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return defaults on error
    return getDefaultSettings();
  }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    // Bank account details
    account_name: 'Famous Jelly Luxe',
    bank_name: 'Access Bank',
    account_number: '1770816426',
    account_type: 'Business Account',
    // Store settings
    store_name: 'Famous Jelly Luxe',
    store_email: 'hello@fjlclothing.shop',
    business_name: '',
    store_phone: '',
    store_address: '',
    tax_rate: 7.5,
    shipping_cost: 0,
    currency: 'NGN',
    currency_symbol: '₦',
    // Email settings
    delivery_days: 5
  };
}

/**
 * Update business settings
 * Updates individual key-value pairs in the settings table
 */
export async function updateSettings(settingsData) {
  try {
    // Map the incoming data to the settings table structure
    const updates = [
      { key: 'business_name', value: settingsData.business_name, type: 'string' },
      { key: 'store_name', value: settingsData.store_name, type: 'string' },
      { key: 'store_email', value: settingsData.store_email, type: 'string' },
      { key: 'store_phone', value: settingsData.store_phone, type: 'string' },
      { key: 'store_address', value: settingsData.store_address, type: 'string' },
      { key: 'bank_name', value: settingsData.bank_name, type: 'string' },
      { key: 'account_number', value: settingsData.account_number, type: 'string' },
      { key: 'account_type', value: settingsData.account_type, type: 'string' },
      { key: 'tax_rate', value: String(parseFloat(settingsData.tax_rate) || 7.5), type: 'number' },
      { key: 'shipping_cost', value: String(parseFloat(settingsData.shipping_cost) || 0), type: 'number' },
      { key: 'currency', value: settingsData.currency || 'NGN', type: 'string' },
      { key: 'currency_symbol', value: settingsData.currency_symbol || '₦', type: 'string' },
      { key: 'delivery_days', value: String(parseInt(settingsData.delivery_days) || 5), type: 'number' }
    ];

    // Update each setting in the table
    for (const update of updates) {
      if (update.value === undefined || update.value === null) {
        continue; // Skip undefined values
      }

      const { error } = await supabase
        .from('store_settings')
        .upsert({
          setting_key: update.key,
          setting_value: update.value,
          setting_type: update.type,
          updated_at: new Date()
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error(`Error updating setting ${update.key}:`, error);
        throw error;
      }
    }

    // Clear cache to force refresh
    settingsCache = null;
    cacheTimestamp = null;

    console.log('✅ Settings updated successfully');

    // Return the updated settings
    return await getSettings();
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new AppError('Failed to update settings', 500);
  }
}

/**
 * Get specific setting by key
 */
export async function getSetting(key) {
  const settings = await getSettings();
  return settings[key] || null;
}

/**
 * Clear settings cache
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = null;
  console.log('🧹 Settings cache cleared');
}

export default {
  getSettings,
  updateSettings,
  getSetting,
  clearSettingsCache
};
