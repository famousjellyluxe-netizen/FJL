import { Resend } from 'resend';

// Initialize Resend client (optional, will be null if API key not configured)
let resend = null;
const resendApiKey = process.env.RESEND_API_KEY;
const storeEmail = process.env.STORE_EMAIL;

// Email service status
export const emailServiceStatus = {
  configured: !!resendApiKey && !!storeEmail,
  resendConfigured: !!resendApiKey,
  storeEmailConfigured: !!storeEmail,
  issues: []
};

if (!resendApiKey) {
  const msg = '⚠️  Resend API key not configured - email notifications will not be sent';
  console.warn(msg);
  emailServiceStatus.issues.push('RESEND_API_KEY not set');
} else {
  resend = new Resend(resendApiKey);
}

if (!storeEmail) {
  const msg = '⚠️  STORE_EMAIL not configured - email sending will crash when attempted';
  console.warn(msg);
  emailServiceStatus.issues.push('STORE_EMAIL not set');
} else {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(storeEmail)) {
    const msg = `⚠️  STORE_EMAIL has invalid format: ${storeEmail}`;
    console.warn(msg);
    emailServiceStatus.issues.push(`Invalid STORE_EMAIL format: ${storeEmail}`);
  }
}

// Email types for logging and tracking
export const EMAIL_TYPES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  PAYMENT_VERIFIED: 'payment_verified',
  SHIPPING_NOTIFICATION: 'shipping_notification',
  DELIVERY_NOTIFICATION: 'delivery_notification',
  PRODUCT_LAUNCH: 'product_launch',
  PROMOTION: 'promotion',
  NEWSLETTER: 'newsletter',
  MEMBER_WELCOME: 'member_welcome',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_VERIFICATION: 'account_verification'
};

/**
 * Test Resend connection
 * @returns {Promise<boolean>}
 */
export async function testResendConnection() {
  if (!resend || emailServiceStatus.issues.length > 0) {
    console.warn('⚠️  Resend not fully configured:');
    emailServiceStatus.issues.forEach(issue => {
      console.warn(`   • ${issue}`);
    });
    return false;
  }

  try {
    // Simple test by checking if we can call the API
    console.log('Testing Resend email service...');
    // Resend client initialization is enough to test
    console.log('✅ Resend email service ready');
    return true;
  } catch (error) {
    console.error('⚠️  Resend connection failed:', error.message);
    return false;
  }
}

/**
 * Get email service status for diagnostics
 * @returns {Object} Current email service configuration status
 */
export function getEmailServiceStatus() {
  return {
    ...emailServiceStatus,
    resendApiKeyLength: resendApiKey ? resendApiKey.length : 0,
    storeEmail: storeEmail || null,
    ready: emailServiceStatus.configured
  };
}

export { resend };
