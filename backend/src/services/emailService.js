import { resend, EMAIL_TYPES } from '../config/resend.js';
import { supabase } from '../config/database.js';

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
 * Send order confirmation email
 */
export async function sendOrderConfirmation(order, customer) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - order confirmation email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const itemsList = order.items
      .map(item => `
        <li>
          <strong>${item.product_name}</strong><br>
          Size: ${item.size}${item.color ? `, Color: ${item.color}` : ''}<br>
          Qty: ${item.quantity} x ₦${parseFloat(item.unit_price).toLocaleString('en-NG', {minimumFractionDigits: 2})}<br>
          Subtotal: ₦${parseFloat(item.total_price).toLocaleString('en-NG', {minimumFractionDigits: 2})}
        </li>
      `)
      .join('');

    const htmlContent = `
      <h2>Order Confirmation</h2>
      <p>Hi ${customer.first_name},</p>
      <p>Thank you for your order! Your order #${order.order_number} has been received.</p>

      <h3>Order Details:</h3>
      <ul>${itemsList}</ul>

      <h3>Totals:</h3>
      <p>Subtotal: ₦${parseFloat(order.subtotal).toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
      <p>Tax (${process.env.TAX_RATE}%): ₦${parseFloat(order.tax).toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
      <p>Shipping: ₦${parseFloat(order.shipping_cost || 0).toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
      <p><strong>Total: ₦${parseFloat(order.total_amount).toLocaleString('en-NG', {minimumFractionDigits: 2})}</strong></p>

      <h3>Shipping Address:</h3>
      <p>
        ${order.shipping_first_name} ${order.shipping_last_name}<br>
        ${order.shipping_address}<br>
        ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br>
        ${order.shipping_country}
      </p>

      <p>We'll send you a tracking number soon!</p>
      <p>Best regards,<br>Famous Jelly Luxe Team</p>
    `;

    const response = await resend.emails.send({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Order Confirmation - Order #${order.order_number}`,
      html: htmlContent
    });

    // Log email
    await logEmail({
      campaign_id: null,
      recipient_id: customer.id,
      recipient_email: customer.email,
      email_type: EMAIL_TYPES.ORDER_CONFIRMATION,
      resend_message_id: response.id,
      resend_response: response,
      send_status: response.id ? 'sent' : 'failed',
      sent_at: new Date(),
      order_id: order.id,
      user_id: customer.id
    });

    return { success: true, messageId: response.id };
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
 * Send payment verified email
 */
export async function sendPaymentVerified(order, customer) {
  if (!resend) {
    console.warn('⚠️  Email service not configured - payment verification email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const htmlContent = `
      <h2>Payment Confirmed</h2>
      <p>Hi ${customer.first_name},</p>
      <p>Great news! We've received and verified your payment for order #${order.order_number}.</p>

      <h3>Payment Details:</h3>
      <p>Amount: ₦${parseFloat(order.total_amount).toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
      <p>Payment Method: ${order.payment_method === 'bank_transfer' ? 'Bank Transfer' : order.payment_method}</p>

      <p>Your order is now being processed and will be shipped soon. You'll receive a tracking number shortly.</p>
      <p>Best regards,<br>Famous Jelly Luxe Team</p>
    `;

    const response = await resend.emails.send({
      from: process.env.STORE_EMAIL,
      to: customer.email,
      subject: `Payment Confirmed - Order #${order.order_number}`,
      html: htmlContent
    });

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
