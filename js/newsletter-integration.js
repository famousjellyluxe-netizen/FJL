/**
 * Newsletter Subscription Integration
 * Handles newsletter signup with API integration and offline support
 */

(function() {
  'use strict';

  /**
   * Validate email format
   */
  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Subscribe to newsletter via API or offline
   */
  async function subscribeToNewsletter(email, fullName = null, source = 'homepage_modal') {
    console.log('📧 Subscribing to newsletter...');

    // Validate email
    if (!isValidEmail(email)) {
      if (window.notifications) {
        window.notifications.error('Please enter a valid email address');
      }
      return { success: false, error: 'Invalid email' };
    }

    try {
      // Try API first
      const result = await apiManager.call('/customers/members/subscribe', {
        method: 'POST',
        body: {
          email: email.toLowerCase(),
          full_name: fullName || null,
          source: source
        }
      }, false);

      if (result.success && result.data) {
        console.log(`✅ Subscribed to newsletter: ${email}`);

        // Cache subscription
        const subscriptions = JSON.parse(localStorage.getItem('fjl_subscriptions') || '[]');
        subscriptions.push({
          email: email.toLowerCase(),
          full_name: fullName,
          source: source,
          timestamp: new Date().toISOString(),
          status: 'subscribed',
          synced: true
        });
        localStorage.setItem('fjl_subscriptions', JSON.stringify(subscriptions));

        if (window.notifications) {
          window.notifications.success(
            'Thank you for subscribing! Check your email for a welcome message.'
          );
        }

        return {
          success: true,
          email: email,
          method: 'api'
        };
      }

      // API error - check if offline
      if (result.error && !apiManager.isOnline) {
        console.warn('⚠️  Offline - queuing newsletter subscription');
        return subscribeOffline(email, fullName, source);
      }

      throw new Error(result.error || 'Subscription failed');
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);

      if (window.notifications) {
        if (error.details && error.details.length > 0) {
          window.notifications.error(
            'Already subscribed' in error.message ?
              'This email is already subscribed' :
              'Subscription failed. Please try again.'
          );
        } else {
          window.notifications.error('Subscription failed. Please try again.');
        }
      }

      // Fallback to offline
      if (!apiManager.isOnline) {
        return subscribeOffline(email, fullName, source);
      }

      throw error;
    }
  }

  /**
   * Subscribe offline (fallback)
   */
  function subscribeOffline(email, fullName = null, source = 'homepage_modal') {
    const subscriptions = JSON.parse(localStorage.getItem('fjl_subscriptions') || '[]');

    // Check if already subscribed
    if (subscriptions.some(s => s.email === email.toLowerCase())) {
      if (window.notifications) {
        window.notifications.info('Email is already subscribed or pending');
      }
      return { success: false, error: 'Already subscribed', offline: true };
    }

    // Add subscription
    subscriptions.push({
      email: email.toLowerCase(),
      full_name: fullName,
      source: source,
      timestamp: new Date().toISOString(),
      status: 'pending',
      synced: false
    });

    localStorage.setItem('fjl_subscriptions', JSON.stringify(subscriptions));

    console.log('📦 Newsletter subscription queued offline');

    if (window.notifications) {
      window.notifications.info(
        'You are offline. Subscription will be sent when you go online.'
      );
    }

    return {
      success: true,
      email: email,
      method: 'offline',
      queued: true
    };
  }

  /**
   * Process offline subscriptions when coming online
   */
  async function syncOfflineSubscriptions() {
    const subscriptions = JSON.parse(localStorage.getItem('fjl_subscriptions') || '[]');
    const pending = subscriptions.filter(s => s.synced === false);

    if (pending.length === 0) {
      return;
    }

    console.log(`📤 Syncing ${pending.length} offline subscriptions...`);

    for (const subscription of pending) {
      try {
        const result = await apiManager.call('/customers/members/subscribe', {
          method: 'POST',
          body: {
            email: subscription.email,
            full_name: subscription.full_name,
            source: subscription.source
          }
        }, false);

        if (result.success) {
          console.log(`✅ Synced subscription: ${subscription.email}`);

          // Mark as synced
          const index = subscriptions.findIndex(s => s.email === subscription.email);
          if (index >= 0) {
            subscriptions[index].synced = true;
            subscriptions[index].status = 'subscribed';
          }
        }
      } catch (error) {
        console.error(`Error syncing subscription ${subscription.email}:`, error);
      }
    }

    // Update localStorage
    localStorage.setItem('fjl_subscriptions', JSON.stringify(subscriptions));
  }

  /**
   * Handle newsletter form submission
   */
  window.handleNewsletterSubmit = async function(email, name = null, source = 'footer') {
    if (!email || !isValidEmail(email)) {
      if (window.notifications) {
        window.notifications.error('Please enter a valid email address');
      }
      return;
    }

    const result = await subscribeToNewsletter(email, name, source);

    // Return result for use in HTML
    return result;
  };

  /**
   * Initialize newsletter integration
   */
  window.initializeNewsletterIntegration = function() {
    // Find all newsletter forms
    const forms = document.querySelectorAll('[data-newsletter-form]');

    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const nameInput = form.querySelector('input[type="text"]');
        const source = form.getAttribute('data-newsletter-source') || 'form';

        if (!emailInput) return;

        const email = emailInput.value.trim();
        const name = nameInput ? nameInput.value.trim() : null;

        const result = await subscribeToNewsletter(email, name || null, source);

        if (result.success) {
          form.reset();
          emailInput.focus();
        }
      });
    });

    // Sync offline subscriptions when coming online
    window.addEventListener('online', syncOfflineSubscriptions);

    // Process any pending offline subscriptions
    if (apiManager.isOnline) {
      syncOfflineSubscriptions();
    }

    console.log('✅ Newsletter integration initialized');
  };

  // Auto-initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeNewsletterIntegration);
  } else {
    window.initializeNewsletterIntegration();
  }
})();
