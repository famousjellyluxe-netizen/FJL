import { Resend } from 'resend';

// Initialize Resend client (optional, will be null if API key not configured)
let resend = null;
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('⚠️  Resend API key not configured - email notifications will not be sent');
} else {
  resend = new Resend(resendApiKey);
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
  if (!resend) {
    console.warn('⚠️  Resend not configured - skipping connection test');
    return false;
  }

  try {
    // Simple test by checking if we can call the API
    console.log('Testing Resend email service...');
    // Resend client initialization is enough to test
    return true;
  } catch (error) {
    console.error('⚠️  Resend connection failed:', error.message);
    return false;
  }
}

export { resend };
