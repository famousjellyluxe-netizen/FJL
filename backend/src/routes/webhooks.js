/**
 * Webhook Routes for External Services (Resend, Payment Providers, etc.)
 */
import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

/**
 * Resend Webhook Handler
 * Handles email delivery events from Resend
 *
 * Event types: email.sent, email.delivered, email.bounced, email.complained, email.opened, email.clicked
 */
router.post('/resend', express.json(), async (req, res) => {
  const startTime = Date.now();

  try {
    const event = req.body;

    console.log('📨 Resend Webhook Event Received:');
    console.log(`   Type: ${event.type}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`   Data:`, JSON.stringify(event.data, null, 2));

    // Validate webhook signature (if configured)
    // const signature = req.headers['resend-signature'];
    // if (!verifyWebhookSignature(signature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Process different event types
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(event.data);
        break;

      case 'email.delivered':
        await handleEmailDelivered(event.data);
        break;

      case 'email.bounced':
        await handleEmailBounced(event.data);
        break;

      case 'email.complained':
        await handleEmailComplained(event.data);
        break;

      case 'email.opened':
        await handleEmailOpened(event.data);
        break;

      case 'email.clicked':
        await handleEmailClicked(event.data);
        break;

      default:
        console.warn(`⚠️  Unknown webhook event type: ${event.type}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Webhook processed in ${duration}ms`);

    // Always return 200 quickly to acknowledge receipt
    res.status(200).json({ received: true, processed_in_ms: duration });

  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    console.error('   Stack:', error.stack);

    // Log error but still return 200 to prevent Resend from retrying
    res.status(200).json({
      received: true,
      error: 'Processing failed but acknowledged',
      message: error.message
    });
  }
});

/**
 * Handle email.sent event
 * Email was accepted by Resend and queued for delivery
 */
async function handleEmailSent(data) {
  const { email_id, to, from, subject, created_at } = data;

  console.log(`   ✉️  Email Sent: ${email_id}`);

  // Update email log status
  const { error } = await supabase
    .from('email_logs')
    .update({
      send_status: 'sent',
      sent_at: new Date(created_at || Date.now())
    })
    .eq('resend_message_id', email_id);

  if (error) {
    console.error('   ⚠️  Failed to update email log:', error.message);
  }
}

/**
 * Handle email.delivered event
 * Email was successfully delivered to recipient's mail server
 */
async function handleEmailDelivered(data) {
  const { email_id, to, created_at } = data;

  console.log(`   ✅ Email Delivered: ${email_id} to ${to}`);

  // Update email log status
  const { error } = await supabase
    .from('email_logs')
    .update({
      send_status: 'delivered',
      delivered_at: new Date(created_at || Date.now())
    })
    .eq('resend_message_id', email_id);

  if (error) {
    console.error('   ⚠️  Failed to update email log:', error.message);
  }
}

/**
 * Handle email.bounced event
 * Email bounced (hard or soft bounce)
 */
async function handleEmailBounced(data) {
  const { email_id, to, bounce_type, bounce_reason, created_at } = data;

  console.error(`   ⚠️  Email Bounced: ${email_id} to ${to}`);
  console.error(`      Type: ${bounce_type}, Reason: ${bounce_reason}`);

  // Update email log status
  const { error } = await supabase
    .from('email_logs')
    .update({
      send_status: 'bounced',
      error_message: `Bounce (${bounce_type}): ${bounce_reason}`,
      bounced_at: new Date(created_at || Date.now())
    })
    .eq('resend_message_id', email_id);

  if (error) {
    console.error('   ⚠️  Failed to update email log:', error.message);
  }

  // If hard bounce, consider adding to suppression list
  if (bounce_type === 'hard') {
    console.log(`   📝 Adding ${to} to suppression list (hard bounce)`);
    // TODO: Implement suppression list logic
  }
}

/**
 * Handle email.complained event
 * Recipient marked email as spam
 */
async function handleEmailComplained(data) {
  const { email_id, to, created_at } = data;

  console.error(`   🚫 Spam Complaint: ${email_id} from ${to}`);

  // Update email log status
  const { error } = await supabase
    .from('email_logs')
    .update({
      send_status: 'complained',
      error_message: 'Marked as spam by recipient',
      complained_at: new Date(created_at || Date.now())
    })
    .eq('resend_message_id', email_id);

  if (error) {
    console.error('   ⚠️  Failed to update email log:', error.message);
  }

  // Automatically unsubscribe the user
  console.log(`   📝 Adding ${to} to suppression list (spam complaint)`);
  // TODO: Implement automatic unsubscribe logic
}

/**
 * Handle email.opened event
 * Email was opened by recipient (requires tracking pixel)
 */
async function handleEmailOpened(data) {
  const { email_id, to, opened_at } = data;

  console.log(`   👁️  Email Opened: ${email_id} by ${to}`);

  // Log email open (can be used for engagement metrics)
  const { error } = await supabase
    .from('email_logs')
    .update({
      opened_at: new Date(opened_at || Date.now())
    })
    .eq('resend_message_id', email_id);

  if (error) {
    console.error('   ⚠️  Failed to log email open:', error.message);
  }
}

/**
 * Handle email.clicked event
 * Link in email was clicked
 */
async function handleEmailClicked(data) {
  const { email_id, to, link, clicked_at } = data;

  console.log(`   🔗 Email Link Clicked: ${email_id} by ${to}`);
  console.log(`      Link: ${link}`);

  // Log email click (can be used for engagement metrics)
  const { error } = await supabase
    .from('email_logs')
    .update({
      clicked_at: new Date(clicked_at || Date.now()),
      clicked_link: link
    })
    .eq('resend_message_id', email_id);

  if (error) {
    console.error('   ⚠️  Failed to log email click:', error.message);
  }
}

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'webhooks',
    timestamp: new Date().toISOString()
  });
});

export default router;
