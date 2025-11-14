/**
 * AsyncButtonHandler - Manages loading states for async button operations
 * Prevents double-clicks, shows spinner, disables button during operation
 *
 * Usage:
 *   const handler = new AsyncButtonHandler('submitBtn', {
 *     loadingText: 'Processing...',
 *     timeout: 30000
 *   });
 *
 *   handler.on('click', async () => {
 *     const result = await someAsyncOperation();
 *     return result;
 *   });
 */
class AsyncButtonHandler {
  constructor(buttonId, options = {}) {
    this.button = document.getElementById(buttonId);
    if (!this.button) {
      console.error(`Button with ID "${buttonId}" not found`);
      return;
    }

    this.originalText = this.button.textContent;
    this.originalHTML = this.button.innerHTML;
    this.originalClass = this.button.className;
    this.isLoading = false;
    this.asyncCallback = null;

    // Configuration
    this.options = {
      loadingText: options.loadingText || 'Processing...',
      loadingClass: options.loadingClass || 'loading',
      spinner: options.spinner || '⏳ ',
      timeout: options.timeout || 30000,
      preventDoubleClick: options.preventDoubleClick !== false,
      onStart: options.onStart || null,
      onSuccess: options.onSuccess || null,
      onError: options.onError || null,
      onFinally: options.onFinally || null,
    };

    this.setupClickHandler();
  }

  setupClickHandler() {
    this.button.addEventListener('click', (e) => {
      // Prevent double-click if already loading
      if (this.isLoading && this.options.preventDoubleClick) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      // Execute async operation
      this.executeAsync();
    });
  }

  async executeAsync() {
    if (this.isLoading) return;
    if (!this.asyncCallback) {
      console.error('No async callback configured');
      return;
    }

    this.setLoading(true);

    // Call onStart callback
    if (this.options.onStart) {
      this.options.onStart();
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timeout')),
        this.options.timeout
      )
    );

    try {
      // Race against timeout
      const result = await Promise.race([
        this.asyncCallback(),
        timeoutPromise
      ]);

      // Call onSuccess callback
      if (this.options.onSuccess) {
        this.options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Async operation failed:', error);

      // Call onError callback
      if (this.options.onError) {
        this.options.onError(error);
      }

      // Show error to user
      const errorMsg = error.message || 'An error occurred. Please try again.';
      if (typeof showNotification === 'function') {
        showNotification(errorMsg, 'error');
      }

      throw error;
    } finally {
      this.setLoading(false);

      // Call onFinally callback
      if (this.options.onFinally) {
        this.options.onFinally();
      }
    }
  }

  setLoading(loading) {
    this.isLoading = loading;

    if (loading) {
      // Disable button and show loading state
      this.button.disabled = true;
      this.button.classList.add(this.options.loadingClass);

      // Add spinner and loading text
      const spinner = document.createElement('span');
      spinner.className = 'button-spinner';
      spinner.textContent = this.options.spinner;

      const text = document.createElement('span');
      text.className = 'button-text';
      text.textContent = this.options.loadingText;

      this.button.innerHTML = '';
      this.button.appendChild(spinner);
      this.button.appendChild(text);
    } else {
      // Re-enable button and restore original state
      this.button.disabled = false;
      this.button.classList.remove(this.options.loadingClass);
      this.button.textContent = this.originalText;

      // Try to restore original HTML if it was more complex
      if (this.originalHTML.includes('<')) {
        this.button.innerHTML = this.originalHTML;
      }
    }
  }

  on(event, callback) {
    if (event === 'click') {
      this.asyncCallback = callback;
    }
    return this;  // Allow chaining
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsyncButtonHandler;
}
