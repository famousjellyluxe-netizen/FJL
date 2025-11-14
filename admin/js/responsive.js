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
    // Find or create menu toggle button
    let menuButton = document.querySelector('.mobile-menu-btn');

    if (!menuButton && this.header) {
      menuButton = document.createElement('button');
      menuButton.className = 'mobile-menu-btn btn-icon';
      menuButton.innerHTML = '<i class="lucide-menu"></i>';
      menuButton.setAttribute('aria-label', 'Toggle menu');

      // Insert at start of header
      this.header.insertBefore(menuButton, this.header.firstChild);
    }

    if (menuButton) {
      menuButton.addEventListener('click', () => this.toggleSidebar());
    }

    // Close sidebar when clicking outside on mobile
    if (this.mainContent) {
      this.mainContent.addEventListener('click', () => {
        if (this.sidebarOpen) {
          this.closeSidebar();
        }
      });
    }

    // Close sidebar when clicking a link
    if (this.sidebar) {
      this.sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          this.closeSidebar();
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

export default ResponsiveManager;
