/**
 * Icon Component - Unified icon system for FJL
 * Wraps Lucide Icons for consistent sizing, styling, and accessibility
 *
 * Usage:
 * HTML: <i class="icon" data-lucide="icon-name" data-size="md" aria-label="Label"></i>
 * Admin: Uses CSS classes for styling (icon-sm, icon-md, icon-lg)
 * Client: Uses Tailwind classes alongside icon component
 */

class IconComponent {
  static SIZES = {
    sm: 'icon-sm',
    md: 'icon-md',
    lg: 'icon-lg',
  };

  static STATES = {
    default: 'icon-default',
    hover: 'icon-hover',
    disabled: 'icon-disabled',
    success: 'icon-success',
    warning: 'icon-warning',
    error: 'icon-error',
    info: 'icon-info',
  };

  /**
   * Initialize icon component
   * Ensures Lucide is loaded and icons are rendered
   */
  static init() {
    // Check if Lucide is available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    // Observe DOM changes to re-initialize icons
    this.observeDOMChanges();
  }

  /**
   * Observe DOM mutations and re-initialize icons
   */
  static observeDOMChanges() {
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        // Check if any mutation added elements with data-lucide attribute
        let hasIconMutations = false;
        mutations.forEach((mutation) => {
          if (
            mutation.addedNodes.length > 0 &&
            mutation.type === 'childList'
          ) {
            hasIconMutations = true;
          }
        });

        if (hasIconMutations && typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * Create an icon element
   * @param {string} name - Lucide icon name
   * @param {string} size - Icon size: 'sm', 'md', 'lg'
   * @param {string} label - Accessibility label
   * @param {Object} options - Additional options
   * @returns {HTMLElement}
   */
  static create(name, size = 'md', label = '', options = {}) {
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', name);
    icon.classList.add('icon');

    // Add size class
    if (this.SIZES[size]) {
      icon.classList.add(this.SIZES[size]);
    }

    // Add accessibility label
    if (label) {
      icon.setAttribute('aria-label', label);
    }

    // Add role for icon-only buttons
    if (options.role) {
      icon.setAttribute('role', options.role);
    }

    // Add custom classes
    if (options.class) {
      icon.classList.add(...options.class.split(' '));
    }

    // Add state class
    if (options.state && this.STATES[options.state]) {
      icon.classList.add(this.STATES[options.state]);
    }

    // Add title attribute for tooltip
    if (options.title) {
      icon.setAttribute('title', options.title);
    }

    return icon;
  }

  /**
   * Set icon size
   * @param {HTMLElement} icon - Icon element
   * @param {string} size - Size: 'sm', 'md', 'lg'
   */
  static setSize(icon, size = 'md') {
    // Remove existing size classes
    Object.values(this.SIZES).forEach((sizeClass) => {
      icon.classList.remove(sizeClass);
    });

    // Add new size class
    if (this.SIZES[size]) {
      icon.classList.add(this.SIZES[size]);
    }
  }

  /**
   * Set icon state
   * @param {HTMLElement} icon - Icon element
   * @param {string} state - State: 'default', 'hover', 'disabled', etc.
   */
  static setState(icon, state = 'default') {
    // Remove existing state classes
    Object.values(this.STATES).forEach((stateClass) => {
      icon.classList.remove(stateClass);
    });

    // Add new state class
    if (this.STATES[state]) {
      icon.classList.add(this.STATES[state]);
    }
  }

  /**
   * Update icon name
   * @param {HTMLElement} icon - Icon element
   * @param {string} name - Lucide icon name
   */
  static setName(icon, name) {
    icon.setAttribute('data-lucide', name);
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Set accessibility label
   * @param {HTMLElement} icon - Icon element
   * @param {string} label - Accessibility label
   */
  static setLabel(icon, label) {
    if (label) {
      icon.setAttribute('aria-label', label);
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    IconComponent.init();
  });
} else {
  IconComponent.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IconComponent;
}
