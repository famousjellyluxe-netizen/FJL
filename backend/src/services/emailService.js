import { resend, EMAIL_TYPES } from '../config/resend.js';
import { supabase } from '../config/database.js';
import * as settingsService from './settingsService.js';

/**
 * Log email sending to database
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
 * Send order confirmation email to customer and admin
 */
export async function sendOrderConfirmation(order, customer) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - order confirmation email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
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

    // ADMIN EMAIL
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

    // Send to customer
    console.log(`📤 Sending to: ${customer.email}`);
    console.log(`📤 From: ${process.env.STORE_EMAIL}`);
    const customerResponse = await resend.emails.send({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Order Confirmation - Order #${order.order_number}`,
      html: customerHtmlContent
    });
    console.log(`📬 Resend API response:`, customerResponse);

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

    // Send to admin
    const adminEmail = settings.store_email || 'hello@fjlclothing.shop';
    try {
      const adminResponse = await resend.emails.send({
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
      console.error('Error sending admin notification:', adminError);
      // Don't throw - customer email was sent successfully, admin email failure shouldn't block order creation
    }

    return { success: true, messageId: customerResponse.id };
  } catch (error) {
    console.error('Error sending order confirmation:', error);

    // Log failed email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.ORDER_CONFIRMATION,
      send_status: 'failed',
      error_message: error.message,
      order_id: order.id,
      user_id: customer.id
    });

    throw error;
  }
}

/**
 * Send payment verified email to customer
 */
export async function sendPaymentVerified(order, customer) {
  console.log('📧 Starting payment verified email process...');

  if (!resend) {
    console.warn('⚠️  Email service not configured - payment verification email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
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

    // Calculate expected delivery date (5-7 business days from now)
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

    // Send to customer
    console.log(`📤 Sending payment verified email to: ${customer.email}`);
    console.log(`📤 From: ${process.env.STORE_EMAIL}`);
    console.log(`📤 Subject: 🎉 Payment Verified — Order #${order.order_number}`);

    const response = await resend.emails.send({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `🎉 Payment Verified — Order #${order.order_number}`,
      html: customerHtmlContent
    });

    console.log('📬 Resend API response:', response);

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
    console.error('Error sending payment verified email:', error);

    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.PAYMENT_VERIFIED,
      send_status: 'failed',
      error_message: error.message,
      order_id: order.id,
      user_id: customer.id
    });

    throw error;
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(order, customer, trackingNumber) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - shipping notification email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
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

    const response = await resend.emails.send({
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
 * Send member welcome email
 */
export async function sendMemberWelcome(member) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - welcome email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
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
    `;

    const response = await resend.emails.send({
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

export default {
  sendOrderConfirmation,
  sendPaymentVerified,
  sendShippingNotification,
  sendMemberWelcome,
  logEmail
};
