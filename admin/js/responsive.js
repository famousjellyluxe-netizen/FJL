/**
 * Mobile Responsive Helper
 * Manages mobile-specific functionality for admin panel
 * - Sidebar toggling
 * - Touch event handling
 * - Orientation changes
 * - Keyboard handling
 */

class ResponsiveManager {
  constructor() {
    this.sidebarOpen = false;
    this.isMobile = window.innerWidth <= 768;
    this.isSmallPhone = window.innerWidth <= 480;

    this.init();
  }

  init() {
    // Get elements
    this.sidebar = document.querySelector('.admin-sidebar');
    this.mainContent = document.querySelector('.admin-main');
    this.header = document.querySelector('.admin-header');

    // Set up listeners
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => this.handleOrientationChange());

    // Mobile-specific setup
    if (this.isMobile) {
      this.setupMobileMenu();
      this.setupTouchHandling();
      this.setupKeyboardHandling();
    }

    // Listen for dynamic page changes
    document.addEventListener('page-loaded', () => this.onPageLoad());

    console.log('✓ Responsive manager initialized', {
      isMobile: this.isMobile,
      isSmallPhone: this.isSmallPhone,
      viewportWidth: window.innerWidth
    });
  }

  /**
   * Set up mobile menu toggle
   */
  setupMobileMenu() {
    // Find existing menu toggle button in header or create one
    let menuButton = document.querySelector('.mobile-menu-btn');

    // If no dedicated mobile menu button, use the existing hamburger icon button
    if (!menuButton) {
      const headerRight = this.header?.querySelector('.header-right');
      if (headerRight) {
        // Check if there's an existing hamburger button (≡ or menu icon)
        const existingMenus = headerRight.querySelectorAll('button:not(#deleteBtn):not(#closeBtnEditProduct)');
        if (existingMenus.length > 0) {
          // Use the last button as menu toggle
          menuButton = existingMenus[existingMenus.length - 1];
          menuButton.classList.add('mobile-menu-btn');
        }
      }
    }

    // Create button if still not found (but not on product-edit page)
    const isProductEditPage = window.location.pathname.includes('product-edit');
    if (!menuButton && this.header && !isProductEditPage) {
      menuButton = document.createElement('button');
      menuButton.className = 'mobile-menu-btn header-icon-btn';
      menuButton.innerHTML = '<i data-lucide="menu"></i>';
      menuButton.setAttribute('aria-label', 'Toggle menu');
      menuButton.setAttribute('title', 'Toggle navigation menu');

      // Insert at end of header-right or header
      const headerRight = this.header.querySelector('.header-right');
      if (headerRight) {
        const headerIcons = headerRight.querySelector('.header-icons');
        if (headerIcons) {
          headerIcons.appendChild(menuButton);
        } else {
          headerRight.appendChild(menuButton);
        }
      } else {
        this.header.appendChild(menuButton);
      }
    }

    if (menuButton) {
      // Remove any existing click listeners by cloning
      const newMenuButton = menuButton.cloneNode(true);
      menuButton.parentNode.replaceChild(newMenuButton, menuButton);
      menuButton = newMenuButton;

      // Add click handler
      menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });

      console.log('✓ Mobile menu button configured');
    }

    // Create overlay for sidebar (if not exists)
    if (this.isMobile && !document.querySelector('.sidebar-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', () => this.closeSidebar());
      document.body.appendChild(overlay);
    }

    // Close sidebar when clicking outside on mobile
    if (this.mainContent) {
      this.mainContent.addEventListener('click', (e) => {
        // Don't close if clicking the menu button
        if (!e.target.closest('.mobile-menu-btn') && this.sidebarOpen && this.isMobile) {
          this.closeSidebar();
        }
      });
    }

    // Close sidebar when clicking a link
    if (this.sidebar) {
      this.sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (this.isMobile) {
            this.closeSidebar();
          }
        });
      });
    }
  }

  /**
   * Set up touch event handling for better mobile UX
   */
  setupTouchHandling() {
    let startX = 0;
    let currentX = 0;

    // Swipe to open sidebar
    this.mainContent?.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    this.mainContent?.addEventListener('touchmove', (e) => {
      currentX = e.touches[0].clientX;

      // Swipe from left edge to open sidebar
      if (startX < 20 && currentX - startX > 50 && !this.sidebarOpen) {
        this.openSidebar();
        e.preventDefault();
      }
    });

    // Swipe to close sidebar
    this.sidebar?.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    this.sidebar?.addEventListener('touchmove', (e) => {
      currentX = e.touches[0].clientX;

      // Swipe to left to close sidebar
      if (startX > 200 && startX - currentX > 50 && this.sidebarOpen) {
        this.closeSidebar();
        e.preventDefault();
      }
    });
  }

  /**
   * Set up keyboard handling
   */
  setupKeyboardHandling() {
    document.addEventListener('keydown', (e) => {
      // ESC to close sidebar
      if (e.key === 'Escape' && this.sidebarOpen) {
        this.closeSidebar();
      }

      // Ctrl/Cmd + M to toggle menu
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        this.toggleSidebar();
      }
    });
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    if (this.sidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  /**
   * Open sidebar
   */
  openSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.add('open');
      document.body.style.overflow = 'hidden'; // Prevent scrolling

      // Show overlay
      const overlay = document.querySelector('.sidebar-overlay');
      if (overlay) {
        overlay.classList.add('visible');
      }

      this.sidebarOpen = true;
      console.log('📱 Sidebar opened');
    }
  }

  /**
   * Close sidebar
   */
  closeSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.remove('open');
      document.body.style.overflow = '';

      // Hide overlay
      const overlay = document.querySelector('.sidebar-overlay');
      if (overlay) {
        overlay.classList.remove('visible');
      }

      this.sidebarOpen = false;
      console.log('📱 Sidebar closed');
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const wasSmallPhone = this.isSmallPhone;
    const wasMobile = this.isMobile;

    this.isMobile = window.innerWidth <= 768;
    this.isSmallPhone = window.innerWidth <= 480;

    // Crossed mobile threshold
    if (wasMobile && !this.isMobile) {
      this.closeSidebar(); // Close drawer
      console.log('📱 Entered desktop mode');
    }

    // Crossed small phone threshold
    if (!wasSmallPhone && this.isSmallPhone) {
      this.onSmallPhoneMode();
      console.log('📱 Entered small phone mode');
    } else if (wasSmallPhone && !this.isSmallPhone) {
      this.onNormalPhoneMode();
      console.log('📱 Entered normal phone mode');
    }
  }

  /**
   * Handle orientation change
   */
  handleOrientationChange() {
    const orientation = window.orientation || screen.orientation.type;
    console.log('📱 Orientation changed:', orientation);

    // Give page time to adjust layout
    setTimeout(() => {
      // Close sidebar on orientation change (on mobile)
      if (this.isMobile && this.sidebarOpen) {
        this.closeSidebar();
      }

      // Trigger any pending layout adjustments
      window.dispatchEvent(new Event('layout-adjust'));
    }, 250);
  }

  /**
   * Called when entering small phone mode (< 480px)
   */
  onSmallPhoneMode() {
    // Stack table columns vertically
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
      table.classList.add('table-stacked');
    });

    // Make inputs touch-friendly (44px minimum height)
    document.querySelectorAll('.btn, input, select, textarea').forEach(el => {
      if (el.offsetHeight < 44) {
        el.style.minHeight = '44px';
        el.style.padding = 'var(--spacing-md)';
      }
    });
  }

  /**
   * Called when exiting small phone mode
   */
  onNormalPhoneMode() {
    const tables = document.querySelectorAll('.table-stacked');
    tables.forEach(table => {
      table.classList.remove('table-stacked');
    });
  }

  /**
   * Called when new page loads (for SPAs)
   */
  onPageLoad() {
    if (this.isMobile && this.sidebarOpen) {
      this.closeSidebar();
    }

    // Ensure touch targets are properly sized
    if (this.isSmallPhone) {
      this.onSmallPhoneMode();
    }
  }

  /**
   * Check if mobile
   */
  isMobileDevice() {
    return this.isMobile;
  }

  /**
   * Check if small phone
   */
  isSmallPhoneDevice() {
    return this.isSmallPhone;
  }

  /**
   * Get viewport info for debugging
   */
  getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: this.isMobile,
      isSmallPhone: this.isSmallPhone,
      orientation: window.orientation || screen.orientation.type,
      pixelRatio: window.devicePixelRatio
    };
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.responsiveManager = new ResponsiveManager();
  });
} else {
  window.responsiveManager = new ResponsiveManager();
}
