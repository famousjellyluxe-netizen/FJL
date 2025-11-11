import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STORE_EMAIL = process.env.STORE_EMAIL;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   COMPREHENSIVE EMAIL DELIVERY DIAGNOSTIC TEST             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Test 1: Environment Variables
console.log('📋 CHECK 1: Environment Variables');
console.log('─────────────────────────────────────────────');
console.log(`STORE_EMAIL: ${STORE_EMAIL || '❌ NOT SET'}`);
console.log(`RESEND_API_KEY: ${RESEND_API_KEY ? '✅ ' + RESEND_API_KEY.substring(0, 10) + '***' : '❌ NOT SET'}`);

if (!RESEND_API_KEY || !STORE_EMAIL) {
    console.error('\n❌ CRITICAL: Missing configuration. Exiting.\n');
    process.exit(1);
}

// Test 2: Email Format Validation
console.log('\n📧 CHECK 2: Email Format Validation');
console.log('─────────────────────────────────────────────');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidFrom = emailRegex.test(STORE_EMAIL);
console.log(`From Email (${STORE_EMAIL}): ${isValidFrom ? '✅ Valid' : '❌ Invalid'}`);

// Test 3: Initialize Resend Client
console.log('\n🔌 CHECK 3: Resend Client Initialization');
console.log('─────────────────────────────────────────────');
let resend;
try {
    resend = new Resend(RESEND_API_KEY);
    console.log('✅ Resend client initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Resend:', error.message);
    process.exit(1);
}

// Test 4: Send Test Email with Full Template
console.log('\n📤 CHECK 4: Sending Test Email');
console.log('─────────────────────────────────────────────');

const testEmail = {
    from: STORE_EMAIL,
    to: STORE_EMAIL, // Send to self for testing
    subject: `[TEST] Email Diagnostic - ${new Date().toISOString()}`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">✅ Email Delivery Test Successful</h2>
  <p>This is a comprehensive email delivery test from Famous Jelly Luxe.</p>

  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <strong>Test Details:</strong><br>
    <ul style="margin: 10px 0;">
      <li>Timestamp: ${new Date().toISOString()}</li>
      <li>From: ${STORE_EMAIL}</li>
      <li>API Key: ${RESEND_API_KEY.substring(0, 10)}***</li>
      <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
    </ul>
  </div>

  <p style="color: #666; font-size: 14px;">
    If you received this email, your Resend configuration is working correctly.
    Check your spam folder if you don't see this in your inbox.
  </p>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

  <p style="font-size: 12px; color: #999;">
    Famous Jelly Luxe<br>
    Email System Diagnostic Test
  </p>
</div>
    `,
    text: `Email Delivery Test

This is a comprehensive email delivery test from Famous Jelly Luxe.

Test Details:
- Timestamp: ${new Date().toISOString()}
- From: ${STORE_EMAIL}
- API Key: ${RESEND_API_KEY.substring(0, 10)}***
- Environment: ${process.env.NODE_ENV || 'development'}

If you received this email, your Resend configuration is working correctly.

Famous Jelly Luxe - Email System Diagnostic Test
`
};

console.log(`Sending to: ${testEmail.to}`);
console.log(`From: ${testEmail.from}`);
console.log(`Subject: ${testEmail.subject}`);

try {
    const startTime = Date.now();
    const response = await resend.emails.send(testEmail);
    const duration = Date.now() - startTime;

    console.log('\n✅ EMAIL SENT SUCCESSFULLY');
    console.log('─────────────────────────────────────────────');
    console.log(`Message ID: ${response.id}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response:`, JSON.stringify(response, null, 2));

} catch (error) {
    console.error('\n❌ EMAIL SENDING FAILED');
    console.error('─────────────────────────────────────────────');
    console.error('Error Message:', error.message);
    console.error('Error Name:', error.name);

    if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.statusCode) {
        console.error('Status Code:', error.statusCode);
    }
}

// Test 5: Send with Additional Headers (Test Rate Limiting Response)
console.log('\n🔍 CHECK 5: Rate Limit & Quota Headers');
console.log('─────────────────────────────────────────────');
console.log('Sending another test email to check rate limits...');

try {
    const response2 = await resend.emails.send({
        from: STORE_EMAIL,
        to: STORE_EMAIL,
        subject: `[TEST 2] Rate Limit Check - ${new Date().toISOString()}`,
        html: '<p>Second test email to check rate limiting.</p>'
    });

    console.log('✅ Second email sent successfully');
    console.log(`Message ID: ${response2.id}`);

} catch (error) {
    console.error('❌ Second email failed:', error.message);
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
        console.error('⚠️  RATE LIMIT OR QUOTA EXCEEDED!');
    }
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                   TEST COMPLETED                           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log('📌 NEXT STEPS:');
console.log('   1. Check your inbox at', STORE_EMAIL);
console.log('   2. Check your spam/junk folder');
console.log('   3. If no email received within 5 minutes:');
console.log('      - Verify SPF/DKIM/DMARC DNS records');
console.log('      - Check Resend dashboard for delivery status');
console.log('      - Check account quota limits');
console.log('\n');
