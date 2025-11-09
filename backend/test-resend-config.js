import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STORE_EMAIL = process.env.STORE_EMAIL;

console.log('\n=== Resend Configuration Test ===\n');
console.log(`STORE_EMAIL: ${STORE_EMAIL || 'NOT SET'}`);
console.log(`RESEND_API_KEY: ${RESEND_API_KEY ? RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);

if (!RESEND_API_KEY) {
    console.error('\n❌ RESEND_API_KEY is not configured!');
    process.exit(1);
}

if (!STORE_EMAIL) {
    console.error('\n❌ STORE_EMAIL is not configured!');
    process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

console.log('\nAttempting to send test email...\n');

try {
    const response = await resend.emails.send({
        from: STORE_EMAIL,
        to: 'hello@fjlclothing.shop',
        subject: 'Resend Configuration Test',
        html: '<h1>Test Email</h1><p>If you received this, Resend is working correctly!</p>'
    });

    if (response.id) {
        console.log('✅ SUCCESS: Email sent!');
        console.log(`Message ID: ${response.id}`);
    } else if (response.error) {
        console.log('❌ Error:', response.error);
    } else {
        console.log('Response:', response);
    }
} catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data?.errors) {
        console.error('Details:', error.response.data.errors);
    }
}
