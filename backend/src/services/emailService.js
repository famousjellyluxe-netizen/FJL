import { resend, EMAIL_TYPES } from '../config/resend.js';
import { supabase } from '../config/database.js';
import * as settingsService from './settingsService.js';

/**
 * Validate email address format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Exponential backoff retry helper
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx except 429)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Log email sending to database with enhanced error details
 */
async function logEmail(emailData) {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert([emailData])
      .select();

    if (error) {
      console.error('Error logging email:', error);
    }
    return data?.[0];
  } catch (error) {
    console.error('Email logging failed:', error);
  }
}

/**
 * Enhanced email sending wrapper with validation, retry, and comprehensive logging
 * @param {Object} emailPayload
 * @returns {Promise<Object>}
 */
async function sendEmailWithRetry(emailPayload) {
  // Validate email payload
  if (!emailPayload.from || !isValidEmail(emailPayload.from)) {
    throw new Error(`Invalid sender email: ${emailPayload.from}`);
  }

  if (!emailPayload.to || !isValidEmail(emailPayload.to)) {
    throw new Error(`Invalid recipient email: ${emailPayload.to}`);
  }

  if (!emailPayload.subject || emailPayload.subject.trim().length === 0) {
    throw new Error('Email subject cannot be empty');
  }

  if (!emailPayload.html || emailPayload.html.trim().length === 0) {
    throw new Error('Email content cannot be empty');
  }

  console.log('📧 Preparing to send email:');
  console.log(`   From: ${emailPayload.from}`);
  console.log(`   To: ${emailPayload.to}`);
  console.log(`   Subject: ${emailPayload.subject}`);

  // Send with retry logic
  const response = await retryWithBackoff(async () => {
    const result = await resend.emails.send(emailPayload);

    // Enhanced logging of response
    console.log('📬 Resend API Response:');
    console.log(`   Message ID: ${result.id || 'N/A'}`);
    console.log(`   Status: ${result.id ? 'Accepted' : 'Failed'}`);

    if (result.error) {
      console.error('❌ Resend API Error:', result.error);
      throw new Error(`Resend API Error: ${JSON.stringify(result.error)}`);
    }

    return result;
  }, 3, 1000);

  return response;
}

/**
 * Send order confirmation email to customer and admin (ENHANCED)
 */
export async function sendOrderConfirmation(order, customer) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - order confirmation email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Validate customer email before proceeding
    if (!isValidEmail(customer.email)) {
      throw new Error(`Invalid customer email address: ${customer.email}`);
    }

    // Fetch business settings dynamically
    const settings = await settingsService.getSettings();

    // Format order items for display
    const itemsText = order.items
      .map(item => {
        const sizeColor = `Size: ${item.size}${item.color ? ` | Color: ${item.color}` : ''}`;
        const subtotal = parseFloat(item.total_price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        return `${item.product_name}\n${sizeColor} | Qty: ${item.quantity}\nSubtotal: ${settings.currency_symbol}${subtotal}`;
      })
      .join('\n\n');

    const subtotal = parseFloat(order.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const tax = parseFloat(order.tax).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const shipping = parseFloat(order.shipping_cost || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const total = parseFloat(order.total_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const orderDate = new Date(order.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

    // CUSTOMER EMAIL
    const customerHtmlContent = `
      <pre style="font-family: 'Courier New', monospace; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">Hi ${customer.first_name},

Thank you for shopping with Famous Jelly Luxe!

Here's your order summary:

───────────────────────────────
${itemsText}
Subtotal: ${settings.currency_symbol}${subtotal}
Tax (7.5%): ${settings.currency_symbol}${tax}
Shipping: Free
───────────────────────────────
Total: ${settings.currency_symbol}${total}

Please transfer ${settings.currency_symbol}${total} to:
Account Name: ${settings.account_name}
Bank: ${settings.bank_name}
Account Number: ${settings.account_number}
Account Type: ${settings.account_type}

Once your payment is received, you'll get a confirmation email and your order will be processed.

Thanks again for choosing FJL.
Stay fresh. Stay fearless.</pre>
    `;

    // Send to customer with retry
    console.log(`📤 Sending order confirmation to customer: ${customer.email}`);
    const customerResponse = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Order Confirmation - Order #${order.order_number}`,
      html: customerHtmlContent
    });

    // Log customer email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.ORDER_CONFIRMATION,
      resend_message_id: customerResponse.id,
      resend_response: customerResponse,
      send_status: customerResponse.id ? 'sent' : 'failed',
      sent_at: new Date(),
      order_id: order.id,
      user_id: customer.id
    });

    console.log(`✅ Order confirmation sent to customer: ${customer.email}`);

    // ADMIN EMAIL
    const adminEmail = settings.store_email || 'hello@fjlclothing.shop';
    const adminHtmlContent = `
      <pre style="font-family: 'Courier New', monospace; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">Hi Famous Jelly Luxe Team,

A new order has just been placed on your store.
Here are the details:

───────────────────────────────
🧾 Order Summary

Customer Name: ${customer.first_name} ${customer.last_name}
Email: ${customer.email}
Phone: ${order.shipping_phone}
Date: ${orderDate}
Payment Status: Pending (Manual Transfer)
Payment Method: Bank Transfer

───────────────────────────────
📦 Items Ordered

${itemsText}
───────────────────────────────
Total Amount: ${settings.currency_symbol}${total}

───────────────────────────────
🚚 Shipping Details

Address:
${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}
Country: ${order.shipping_country}

───────────────────────────────
💳 Payment Info

The buyer has been instructed to transfer ${settings.currency_symbol}${total} to:
Account Name: ${settings.account_name}
Bank: ${settings.bank_name}
Account Number: ${settings.account_number}
Account Type: ${settings.account_type}

Customer's Bank Account Name (as entered): ${order.buyer_name}

🕒 Wait for your bank alert or statement before marking this order as paid.
Ensure the account name on your bank alert matches the customer's provided account name.

───────────────────────────────
📩 Next Steps

1. Verify payment in your bank account.
2. Once payment is confirmed, email the buyer at ${customer.email}
   to confirm and prepare for shipping.
3. Mark the order as Paid & Processing in your records.

───────────────────────────────
Famous Jelly Luxe Order System
© 2025 Famous Jelly Luxe. All Rights Reserved.</pre>
    `;

    // Send to admin (non-blocking - don't fail order if admin email fails)
    try {
      const adminResponse = await sendEmailWithRetry({
        from: process.env.STORE_EMAIL,
        to: adminEmail,
        subject: `🛍️ New Order Received — from ${customer.first_name} ${customer.last_name}`,
        html: adminHtmlContent
      });

      // Log admin email
      await logEmail({
        campaign_id: null,
        recipient_id: null,
        recipient_email: adminEmail,
        email_type: 'order_admin_notification',
        resend_message_id: adminResponse.id,
        resend_response: adminResponse,
        send_status: adminResponse.id ? 'sent' : 'failed',
        sent_at: new Date(),
        order_id: order.id,
        user_id: null
      });

      console.log(`✅ Order notification sent to admin: ${adminEmail}`);
    } catch (adminError) {
      console.error('⚠️  Error sending admin notification (non-blocking):', adminError.message);
      // Log failure but don't throw
      await logEmail({
        campaign_id: null,
        recipient_id: null,
        recipient_email: adminEmail,
        email_type: 'order_admin_notification',
        send_status: 'failed',
        error_message: adminError.message,
        order_id: order.id,
        user_id: null
      });
    }

    return { success: true, messageId: customerResponse.id };
  } catch (error) {
    console.error('❌ Error sending order confirmation:', error.message);
    console.error('   Stack:', error.stack);

    // Log failed email with comprehensive error details
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.ORDER_CONFIRMATION,
      send_status: 'failed',
      error_message: error.message,
      resend_response: { error: error.message, stack: error.stack },
      order_id: order.id,
      user_id: customer.id
    });

    throw error;
  }
}

/**
 * Send payment verified email to customer (ENHANCED)
 */
export async function sendPaymentVerified(order, customer) {
  console.log('📧 Starting payment verified email process...');

  if (!resend) {
    console.warn('⚠️  Email service not configured - payment verification email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Validate customer email
    if (!isValidEmail(customer.email)) {
      throw new Error(`Invalid customer email address: ${customer.email}`);
    }

    // Fetch business settings dynamically
    console.log('📦 Fetching settings...');
    const settings = await settingsService.getSettings();
    console.log('✅ Settings fetched:', { store_email: settings.store_email, delivery_days: settings.delivery_days });

    // Format order items for display
    const itemsText = order.items
      .map(item => {
        const sizeColor = `Size: ${item.size}${item.color ? ` | Color: ${item.color}` : ''}`;
        const itemPrice = parseFloat(item.unit_price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        const itemTotal = parseFloat(item.total_price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        return `${item.product_name}\n${sizeColor} | Qty: ${item.quantity}\nPrice: ${settings.currency_symbol}${itemPrice} x ${item.quantity} = ${settings.currency_symbol}${itemTotal}`;
      })
      .join('\n\n');

    const subtotal = parseFloat(order.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const tax = parseFloat(order.tax).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const shipping = parseFloat(order.shipping_cost || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const total = parseFloat(order.total_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const orderDate = new Date(order.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

    // Calculate expected delivery date
    const deliveryDays = settings.delivery_days || 5;
    const expectedDeliveryDate = new Date(order.created_at);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + deliveryDays);
    const deliveryDateStr = expectedDeliveryDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

    // CUSTOMER EMAIL
    const customerHtmlContent = `
      <pre style="font-family: 'Courier New', monospace; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">Hi ${customer.first_name},

🎉 Payment Verified - Order #${order.order_number}

Thank you! We've received and verified your payment for order #${order.order_number}.

───────────────────────────────
📦 Your Order Details

Order Number: #${order.order_number}
Order Date: ${orderDate}
Status: Payment Verified ✓

${itemsText}

───────────────────────────────
💳 Payment Summary

Subtotal: ${settings.currency_symbol}${subtotal}
Tax (7.5%): ${settings.currency_symbol}${tax}
Shipping: Free
───────────────────────────────
Total Paid: ${settings.currency_symbol}${total}

───────────────────────────────
📅 What's Next?

Your order is now being processed and prepared for shipment.
Expected Delivery: ${deliveryDateStr}

We'll notify you as soon as your package is on its way with a tracking number.

───────────────────────────────
💬 Questions?

If you have any questions about your order, please reach out to us at ${settings.store_email}.

Thanks for choosing Famous Jelly Luxe!
Stay fresh. Stay fearless.</pre>
    `;

    // Send to customer with retry
    console.log(`📤 Sending payment verified email to: ${customer.email}`);
    const response = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `🎉 Payment Verified — Order #${order.order_number}`,
      html: customerHtmlContent
    });

    console.log('📬 Email sent successfully');

    // Log email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.PAYMENT_VERIFIED,
      resend_message_id: response.id,
      resend_response: response,
      send_status: response.id ? 'sent' : 'failed',
      sent_at: new Date(),
      order_id: order.id,
      user_id: customer.id
    });

    console.log(`✅ Payment verified email sent to customer: ${customer.email}`);

    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('❌ Error sending payment verified email:', error.message);
    console.error('   Stack:', error.stack);

    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.PAYMENT_VERIFIED,
      send_status: 'failed',
      error_message: error.message,
      resend_response: { error: error.message, stack: error.stack },
      order_id: order.id,
      user_id: customer.id
    });

    throw error;
  }
}

/**
 * Send shipping notification email (ENHANCED)
 */
export async function sendShippingNotification(order, customer, trackingNumber) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - shipping notification email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    if (!isValidEmail(customer.email)) {
      throw new Error(`Invalid customer email address: ${customer.email}`);
    }

    const htmlContent = `
      <h2>Order Shipped</h2>
      <p>Hi ${customer.first_name},</p>
      <p>Your order #${order.order_number} has been shipped!</p>

      ${trackingNumber ? `
        <h3>Tracking Number:</h3>
        <p><strong>${trackingNumber}</strong></p>
      ` : ''}

      <p>Your order will arrive shortly. Thank you for shopping with Famous Jelly Luxe!</p>
      <p>Best regards,<br>Famous Jelly Luxe Team</p>
    `;

    const response = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Your Order #${order.order_number} Has Shipped`,
      html: htmlContent
    });

    // Log email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.SHIPPING_NOTIFICATION,
      resend_message_id: response.id,
      resend_response: response,
      send_status: response.id ? 'sent' : 'failed',
      sent_at: new Date(),
      order_id: order.id,
      user_id: customer.id
    });

    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending shipping notification:', error);

    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.SHIPPING_NOTIFICATION,
      send_status: 'failed',
      error_message: error.message,
      order_id: order.id,
      user_id: customer.id
    });

    throw error;
  }
}

/**
 * Send member welcome email (ENHANCED)
 */
export async function sendMemberWelcome(member) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - welcome email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    if (!isValidEmail(member.email)) {
      throw new Error(`Invalid member email address: ${member.email}`);
    }

    const baseUrl = process.env.APP_URL || 'https://fjl.com';

    const htmlContent = `
      <h2>Welcome to Our Newsletter!</h2>
      <p>Hi ${member.full_name || 'there'},</p>
      <p>Thank you for subscribing to the Famous Jelly Luxe newsletter!</p>

      <p>You'll now receive:</p>
      <ul>
        <li>New product launches & exclusive previews</li>
        <li>Special member-only promotions</li>
        <li>Style tips & fashion inspiration</li>
        <li>Updates on limited editions & restocks</li>
      </ul>

      <p>Check back soon for our latest collections!</p>
      <p>Best regards,<br>Famous Jelly Luxe Team</p>

      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        You're receiving this because you subscribed to our newsletter.
        <a href="${baseUrl}/unsubscribe.html?token=${member.unsubscribe_token}" style="color: #E09F3E;">Unsubscribe</a>
      </p>
    `;

    const response = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: member.email,
      subject: 'Welcome to Famous Jelly Luxe Newsletter',
      html: htmlContent
    });

    // Log email
    await logEmail({
      campaign_id: null,
      recipient_id: member.id,
      recipient_email: member.email,
      email_type: EMAIL_TYPES.MEMBER_WELCOME,
      resend_message_id: response.id,
      resend_response: response,
      send_status: response.id ? 'sent' : 'failed',
      sent_at: new Date(),
      user_id: member.user_id
    });

    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending member welcome email:', error);

    await logEmail({
      campaign_id: null,
      recipient_id: member.id,
      recipient_email: member.email,
      email_type: EMAIL_TYPES.MEMBER_WELCOME,
      send_status: 'failed',
      error_message: error.message,
      user_id: member.user_id
    });

    throw error;
  }
}

/**
 * Send product announcement email to subscribed members (BATCH SENDING)
 * @param {Array} products - Array of product objects to announce
 * @param {Array} members - Array of member objects to send to
 * @returns {Promise<Object>} - { sent: number, failed: number, errors: Array }
 */
export async function sendProductAnnouncement(products, members) {
  console.log('\n📢 [EMAIL SERVICE] Starting product announcement email campaign...');
  console.log(`📢 [EMAIL SERVICE]   Products: ${products.length}`);
  console.log(`📢 [EMAIL SERVICE]   Recipients: ${members.length}`);

  if (!resend) {
    console.warn('⚠️  [EMAIL SERVICE] Email service not configured - product announcement not sent');
    return { success: false, error: 'Email service not configured', sent: 0, failed: members.length };
  }

  if (!products || products.length === 0) {
    console.error('❌ [EMAIL SERVICE] No products to announce');
    throw new Error('No products to announce');
  }

  if (!members || members.length === 0) {
    console.warn('⚠️  [EMAIL SERVICE] No subscribed members to send to');
    return { success: true, sent: 0, failed: 0, errors: [] };
  }

  // Fetch business settings
  const settings = await settingsService.getSettings();
  const baseUrl = process.env.APP_URL || 'https://fjl.com';

  // Format products for email
  const productsHtml = products.map(product => {
    const price = parseFloat(product.price).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const originalPrice = product.original_price
      ? parseFloat(product.original_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })
      : null;

    const priceDisplay = originalPrice
      ? `${settings.currency_symbol}${price} (was ${settings.currency_symbol}${originalPrice})`
      : `${settings.currency_symbol}${price}`;

    const sizes = Array.isArray(product.available_sizes) ? product.available_sizes.join(', ') : 'N/A';
    const colors = Array.isArray(product.available_colors) ? product.available_colors.join(', ') : 'N/A';
    const productUrl = `${baseUrl}/product.html?id=${product.id}`;

    return `
───────────────────────────────
${product.name}
${priceDisplay}

${product.description || 'No description available.'}

Available Sizes: ${sizes}
Available Colors: ${colors}
Sleeve Type: ${product.sleeve_type || 'N/A'}

👉 View & Purchase: ${productUrl}
`;
  }).join('\n');

  const productCount = products.length;
  const productWord = productCount === 1 ? 'product' : 'products';

  // Email subject
  const subject = productCount === 1
    ? `🎉 New Arrival: ${products[0].name}!`
    : `🎉 ${productCount} New Arrivals at Famous Jelly Luxe!`;

  // Batch sending with rate limiting
  let sent = 0;
  let failed = 0;
  const errors = [];

  console.log(`📢 [EMAIL SERVICE] Starting email loop for ${members.length} members...`);

  for (let index = 0; index < members.length; index++) {
    const member = members[index];
    console.log(`\n📢 [EMAIL SERVICE] Processing member ${index + 1}/${members.length}: ${member.email}`);

    try {
      // Validate member email
      if (!isValidEmail(member.email)) {
        console.warn(`⚠️  [EMAIL SERVICE] Skipping invalid email: ${member.email}`);
        failed++;
        errors.push({ email: member.email, error: 'Invalid email format' });
        continue;
      }

      // Personalized email content
      const htmlContent = `
<pre style="font-family: 'Courier New', monospace; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">Hi ${member.full_name || 'there'},

We're excited to announce ${productCount === 1 ? 'a new arrival' : `${productCount} new arrivals`} at Famous Jelly Luxe!

${productsHtml}

───────────────────────────────

Don't miss out! Shop now and elevate your style.

Stay fresh. Stay fearless.

Famous Jelly Luxe

───────────────────────────────
📧 You're receiving this because you subscribed to our newsletter.
If you'd prefer not to receive product announcements, you can unsubscribe at any time.

Unsubscribe: ${baseUrl}/unsubscribe.html?token=${member.unsubscribe_token}</pre>
      `;

      // Send email with retry
      console.log(`📤 [EMAIL SERVICE] Sending to: ${member.email}`);
      const response = await sendEmailWithRetry({
        from: process.env.STORE_EMAIL,
        to: member.email,
        subject: subject,
        html: htmlContent
      });

      console.log(`📤 [EMAIL SERVICE] Response from Resend:`, { id: response.id, error: response.error });

      // Log email for each product
      // NOTE: Email logging temporarily disabled due to schema mismatch
      // TODO: Fix email_logs table schema to match these fields
      // for (const product of products) {
      //   await logEmail({
      //     recipient_id: member.id,
      //     recipient_email: member.email,
      //     email_type: EMAIL_TYPES.PRODUCT_LAUNCH,
      //     send_status: response.id ? 'sent' : 'failed',
      //     sent_at: new Date(),
      //     product_id: product.id,
      //     user_id: member.user_id || null
      //   });
      // }

      sent++;
      console.log(`✅ [EMAIL SERVICE] Successfully sent to ${member.email} (Total sent: ${sent}/${members.length})`);

      // Rate limiting: 100ms delay between emails
      if (sent < members.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`❌ [EMAIL SERVICE] Failed to send to ${member.email}:`, error.message);
      console.error(`❌ [EMAIL SERVICE] Error stack:`, error);
      failed++;
      errors.push({ email: member.email, error: error.message });

      // Log failed email
      // NOTE: Email logging temporarily disabled due to schema mismatch
      // TODO: Fix email_logs table schema to match these fields
      // for (const product of products) {
      //   await logEmail({
      //     recipient_id: member.id,
      //     recipient_email: member.email,
      //     email_type: EMAIL_TYPES.PRODUCT_LAUNCH,
      //     send_status: 'failed',
      //     error_message: error.message,
      //     product_id: product.id,
      //     user_id: member.user_id || null
      //   });
      // }
    }
  }

  console.log(`\n📊 [EMAIL SERVICE] Campaign Results:`);
  console.log(`📊 [EMAIL SERVICE]    ✅ Sent: ${sent}`);
  console.log(`📊 [EMAIL SERVICE]    ❌ Failed: ${failed}`);
  console.log(`📊 [EMAIL SERVICE]    📦 Products: ${productCount}`);
  console.log(`📊 [EMAIL SERVICE]    Total to process: ${members.length}\n`);

  return {
    success: sent > 0,
    sent,
    failed,
    errors,
    products: productCount,
    members: members.length
  };
}

/**
 * Send contact form email to admin and auto-reply to customer
 * @param {Object} contactData - Contact form data {name, email, subject, message}
 * @returns {Promise<Object>} Result object with success status
 */
export async function sendContactEmail(contactData) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - contact email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const { name, email, subject, message } = contactData;

  try {
    // Email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E09F3E; border-bottom: 2px solid #E09F3E; padding-bottom: 10px;">
          📬 New Contact Form Submission
        </h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
        </div>

        <div style="background: white; padding: 20px; border-left: 4px solid #E09F3E; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Message:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6; color: #555;">${message}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>Reply:</strong> To respond to this inquiry, reply directly to this email or send to
            <a href="mailto:${email}">${email}</a>
          </p>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p>Famous Jelly Luxe Admin Dashboard</p>
          <p>This is an automated message from your contact form</p>
        </footer>
      </div>
    `;

    // Send to admin
    const adminResponse = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: adminEmail,
      replyTo: email, // Allow admin to reply directly to customer
      subject: `[FJL Contact] ${subject}`,
      html: adminHtml
    });

    console.log(`✅ Contact form email sent to admin: ${adminEmail}`);

    // Auto-reply to customer
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E09F3E; border-bottom: 2px solid #E09F3E; padding-bottom: 10px;">
          Thank You for Contacting Us!
        </h2>

        <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>

        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          We've received your message and will get back to you as soon as possible. Our team typically responds within 24-48 hours.
        </p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333; font-size: 14px;">Your Message:</h3>
          <p style="margin: 10px 0; font-size: 13px;"><strong>Subject:</strong> ${subject}</p>
          <p style="white-space: pre-wrap; font-size: 13px; color: #666; line-height: 1.5;">${message}</p>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.APP_URL || 'https://fjl.com'}/shop.html"
             style="display: inline-block; background: #E09F3E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Continue Shopping
          </a>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p><strong>Famous Jelly Luxe</strong></p>
          <p>Luxury Streetwear for the Bold</p>
          <p style="margin-top: 15px;">
            <a href="${process.env.APP_URL || 'https://fjl.com'}" style="color: #E09F3E; text-decoration: none;">Visit Our Website</a> |
            <a href="mailto:${process.env.STORE_EMAIL}" style="color: #E09F3E; text-decoration: none;">Email Us</a>
          </p>
        </footer>
      </div>
    `;

    // Send auto-reply to customer
    const customerResponse = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: email,
      subject: 'We received your message - Famous Jelly Luxe',
      html: customerHtml
    });

    console.log(`✅ Auto-reply sent to customer: ${email}`);

    return {
      success: true,
      adminMessageId: adminResponse.id,
      customerMessageId: customerResponse.id
    };

  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
}

/**
 * Send order cancelled notification to customer
 */
export async function sendOrderCancelled(order, customer) {
  try {
    if (!isValidEmail(customer.email)) {
      console.warn(`⚠️ Invalid customer email: ${customer.email}`);
      return { id: 'mock-id', success: false };
    }

    const settings = await settingsService.getSettings();
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calculate total
    let total = 0;
    let itemsText = '';
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach(item => {
        total += parseFloat(item.total_price || 0);
        itemsText += `- ${item.product_name} (${item.color} - ${item.size}) × ${item.quantity}: ${settings.currency_symbol}${item.total_price}\n`;
      });
    }

    const htmlContent = `
      <pre style="font-family: 'Courier New', monospace; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">Hi ${customer.first_name},

We're writing to confirm that your order has been cancelled.

───────────────────────────────
❌ Order Cancellation Details

Order Number: ${order.order_number}
Date: ${orderDate}
Status: Cancelled

───────────────────────────────
📦 Items (Cancellation)

${itemsText}───────────────────────────────
Subtotal: ${settings.currency_symbol}${(total - (order.tax || 0)).toFixed(2)}
Tax: ${settings.currency_symbol}${(order.tax || 0).toFixed(2)}
Shipping: ${settings.currency_symbol}${(order.shipping_cost || 0).toFixed(2)}
Total: ${settings.currency_symbol}${total.toFixed(2)}

───────────────────────────────
💰 Refund Information

Your payment of ${settings.currency_symbol}${total.toFixed(2)} will be refunded to your original payment method.
Please allow 5-7 business days for the refund to appear in your account.

───────────────────────────────
📞 Questions?

If you have any questions about this cancellation or would like to place a new order, please contact us:
Email: ${settings.store_email || 'hello@fjlclothing.shop'}

Thank you for your understanding!

Famous Jelly Luxe
© 2025 Famous Jelly Luxe. All Rights Reserved.</pre>
    `;

    const response = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Your Order #${order.order_number} Has Been Cancelled`,
      html: htmlContent
    });

    // Log email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: 'order_cancelled',
      resend_message_id: response.id,
      user_id: customer.id
    });

    console.log(`✅ Order cancellation email sent to customer: ${customer.email}`);
    return response;
  } catch (error) {
    console.error('Error sending order cancellation email:', error);
    throw error;
  }
}

/**
 * Send order shipped notification to customer
 */
export async function sendOrderShipped(order, customer) {
  try {
    if (!isValidEmail(customer.email)) {
      console.warn(`⚠️ Invalid customer email: ${customer.email}`);
      return { id: 'mock-id', success: false };
    }

    const settings = await settingsService.getSettings();
    const shippedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build items list
    let itemsText = '';
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach(item => {
        itemsText += `- ${item.product_name} (${item.color} - ${item.size}) × ${item.quantity}\n`;
      });
    }

    const htmlContent = `
      <pre style="font-family: 'Courier New', monospace; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">Hi ${customer.first_name},

Great news! Your order is on its way! 🚚

───────────────────────────────
✅ Shipment Details

Order Number: ${order.order_number}
Shipped Date: ${shippedDate}
Status: Shipped

───────────────────────────────
📦 Items Shipped

${itemsText}───────────────────────────────
🚚 Delivery Information

Your package is on its way to:
${order.shipping_address}
${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}
${order.shipping_country}

Expected Delivery: 5-10 business days

───────────────────────────────
📍 Track Your Order

Please keep an eye on your email for tracking updates.
If you have any tracking information, it will be sent separately.

───────────────────────────────
❓ Need Help?

If you have any questions about your shipment, please contact us:
Email: ${settings.store_email || 'hello@fjlclothing.shop'}

Thank you for your order!

Famous Jelly Luxe
© 2025 Famous Jelly Luxe. All Rights Reserved.</pre>
    `;

    const response = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Your Order #${order.order_number} Has Shipped! 🚚`,
      html: htmlContent
    });

    // Log email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: 'order_shipped',
      resend_message_id: response.id,
      user_id: customer.id
    });

    console.log(`✅ Order shipped email sent to customer: ${customer.email}`);
    return response;
  } catch (error) {
    console.error('Error sending order shipped email:', error);
    throw error;
  }
}

/**
 * Send order delivered notification to customer
 */
export async function sendOrderDelivered(order, customer) {
  try {
    if (!isValidEmail(customer.email)) {
      console.warn(`⚠️ Invalid customer email: ${customer.email}`);
      return { id: 'mock-id', success: false };
    }

    const settings = await settingsService.getSettings();
    const deliveredDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build items list
    let itemsText = '';
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach(item => {
        itemsText += `- ${item.product_name} (${item.color} - ${item.size}) × ${item.quantity}\n`;
      });
    }

    const htmlContent = `
      <pre style="font-family: 'Courier New', monospace; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">Hi ${customer.first_name},

Your order has been delivered! We hope you enjoy your purchase! 📦✨

───────────────────────────────
✅ Delivery Confirmation

Order Number: ${order.order_number}
Delivered: ${deliveredDate}
Status: Delivered

───────────────────────────────
📦 Items Delivered

${itemsText}───────────────────────────────
💬 We'd Love Your Feedback!

Your satisfaction is important to us. If you have a moment, please share your experience:
- How was the quality of your order?
- Was the delivery smooth?
- Would you shop with us again?

Your feedback helps us improve!

───────────────────────────────
🎁 Next Time

Check out our latest collections and exclusive deals for returning customers.
Use code WELCOME10 for 10% off your next purchase!

───────────────────────────────
❓ Questions or Issues?

If there's anything wrong with your order or if you have any concerns, please reach out:
Email: ${settings.store_email || 'hello@fjlclothing.shop'}

Thank you for shopping with Famous Jelly Luxe!

Famous Jelly Luxe
© 2025 Famous Jelly Luxe. All Rights Reserved.</pre>
    `;

    const response = await sendEmailWithRetry({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Your Order #${order.order_number} Has Been Delivered! 📦`,
      html: htmlContent
    });

    // Log email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: 'order_delivered',
      resend_message_id: response.id,
      user_id: customer.id
    });

    console.log(`✅ Order delivered email sent to customer: ${customer.email}`);
    return response;
  } catch (error) {
    console.error('Error sending order delivered email:', error);
    throw error;
  }
}

export default {
  sendOrderConfirmation,
  sendPaymentVerified,
  sendShippingNotification,
  sendOrderCancelled,
  sendOrderShipped,
  sendOrderDelivered,
  sendMemberWelcome,
  sendProductAnnouncement,
  sendContactEmail,
  logEmail
};
