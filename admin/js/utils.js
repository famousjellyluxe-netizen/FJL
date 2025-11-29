/**
 * FJL Admin Panel - Utility Functions
 * Helper functions for formatting, validation, and UI interactions
 */

/**
 * Number Formatting
 */
const numberUtils = {
    /**
     * Format number as currency
     */
    formatCurrency: (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    },

    /**
     * Format number with thousand separators
     */
    formatNumber: (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    },

    /**
     * Format percentage
     */
    formatPercent: (value, decimals = 1) => {
        return `${(value).toFixed(decimals)}%`;
    },

    /**
     * Format large numbers (1.2k, 1.5M, etc.)
     */
    formatCompact: (number) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
        }).format(number);
    },
};

/**
 * Date Formatting
 */
const dateUtils = {
    /**
     * Format date as readable string
     */
    formatDate: (date, format = 'MMM dd, yyyy') => {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };

        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Format date and time
     */
    formatDateTime: (date) => {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    },

    /**
     * Format relative time (2 hours ago, etc.)
     */
    formatRelativeTime: (date) => {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffSec = Math.round(diffMs / 1000);

        if (Math.abs(diffSec) < 60) {
            return rtf.format(diffSec, 'second');
        }

        const diffMin = Math.round(diffSec / 60);
        if (Math.abs(diffMin) < 60) {
            return rtf.format(diffMin, 'minute');
        }

        const diffHour = Math.round(diffMin / 60);
        if (Math.abs(diffHour) < 24) {
            return rtf.format(diffHour, 'hour');
        }

        const diffDay = Math.round(diffHour / 24);
        if (Math.abs(diffDay) < 7) {
            return rtf.format(diffDay, 'day');
        }

        return dateUtils.formatDate(date);
    },

    /**
     * Get date range (Today, This Month, etc.)
     */
    getDateRange: (range) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(today);

        switch (range) {
            case 'today':
                return { start: today, end: new Date() };
            case 'yesterday':
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                const yesterday = new Date(startDate);
                yesterday.setHours(23, 59, 59, 999);
                return { start: startDate, end: yesterday };
            case 'thisWeek':
                startDate.setDate(startDate.getDate() - startDate.getDay());
                return { start: startDate, end: new Date() };
            case 'lastWeek':
                startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
                const endWeek = new Date(startDate);
                endWeek.setDate(endWeek.getDate() + 7);
                return { start: startDate, end: endWeek };
            case 'thisMonth':
                startDate.setDate(1);
                return { start: startDate, end: new Date() };
            case 'lastMonth':
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setDate(1);
                const endMonth = new Date(startDate);
                endMonth.setMonth(endMonth.getMonth() + 1);
                endMonth.setDate(0);
                return { start: startDate, end: endMonth };
            case 'thisYear':
                startDate.setMonth(0);
                startDate.setDate(1);
                return { start: startDate, end: new Date() };
            default:
                return { start: startDate, end: new Date() };
        }
    },
};

/**
 * String Utilities
 */
const stringUtils = {
    /**
     * Capitalize first letter
     */
    capitalize: (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Convert to title case
     */
    titleCase: (str) => {
        return str
            .toLowerCase()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    /**
     * Truncate string
     */
    truncate: (str, length = 50, suffix = '...') => {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + suffix : str;
    },

    /**
     * Generate slug from string
     */
    toSlug: (str) => {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Generate random string
     */
    generateId: (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
};

/**
 * Validation Utilities
 */
const validationUtils = {
    /**
     * Validate email
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate URL
     */
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate phone number
     */
    isValidPhone: (phone) => {
        const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Check if string is not empty
     */
    isNotEmpty: (str) => {
        return str && str.trim().length > 0;
    },

    /**
     * Validate form data
     */
    validateForm: (data, rules) => {
        const errors = {};

        for (const [field, fieldRules] of Object.entries(rules)) {
            const value = data[field];

            for (const rule of fieldRules) {
                if (rule.type === 'required' && !validationUtils.isNotEmpty(String(value))) {
                    errors[field] = rule.message || `${field} is required`;
                    break;
                } else if (rule.type === 'email' && value && !validationUtils.isValidEmail(value)) {
                    errors[field] = rule.message || 'Invalid email address';
                    break;
                } else if (rule.type === 'min' && value && value.length < rule.value) {
                    errors[field] = rule.message || `Minimum ${rule.value} characters required`;
                    break;
                } else if (rule.type === 'max' && value && value.length > rule.value) {
                    errors[field] = rule.message || `Maximum ${rule.value} characters allowed`;
                    break;
                } else if (rule.type === 'pattern' && value && !rule.value.test(value)) {
                    errors[field] = rule.message || 'Invalid format';
                    break;
                } else if (rule.type === 'custom' && !rule.fn(value)) {
                    errors[field] = rule.message || 'Validation failed';
                    break;
                }
            }
        }

        return errors;
    },
};

/**
 * DOM Utilities
 */
const domUtils = {
    /**
     * Get element by ID
     */
    getId: (id) => document.getElementById(id),

    /**
     * Get elements by class
     */
    getClass: (className) => document.querySelectorAll(`.${className}`),

    /**
     * Get element by selector
     */
    query: (selector) => document.querySelector(selector),

    /**
     * Get all elements by selector
     */
    queryAll: (selector) => document.querySelectorAll(selector),

    /**
     * Show element
     */
    show: (element) => {
        if (element) element.style.display = '';
    },

    /**
     * Hide element
     */
    hide: (element) => {
        if (element) element.style.display = 'none';
    },

    /**
     * Toggle visibility
     */
    toggle: (element) => {
        if (element) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
        }
    },

    /**
     * Add class
     */
    addClass: (element, className) => {
        if (element) element.classList.add(className);
    },

    /**
     * Remove class
     */
    removeClass: (element, className) => {
        if (element) element.classList.remove(className);
    },

    /**
     * Toggle class
     */
    toggleClass: (element, className) => {
        if (element) element.classList.toggle(className);
    },

    /**
     * Set text content
     */
    setText: (element, text) => {
        if (element) element.textContent = text;
    },

    /**
     * Set HTML content
     */
    setHtml: (element, html) => {
        if (element) element.innerHTML = html;
    },

    /**
     * Get attribute
     */
    getAttr: (element, attr) => {
        return element?.getAttribute(attr);
    },

    /**
     * Set attribute
     */
    setAttr: (element, attr, value) => {
        if (element) element.setAttribute(attr, value);
    },

    /**
     * Remove attribute
     */
    removeAttr: (element, attr) => {
        if (element) element.removeAttribute(attr);
    },

    /**
     * Check if element has class
     */
    hasClass: (element, className) => {
        return element?.classList.contains(className);
    },

    /**
     * Get parent element
     */
    getParent: (element, selector) => {
        return element?.closest(selector);
    },

    /**
     * Get all children
     */
    getChildren: (element, selector) => {
        return selector
            ? element?.querySelectorAll(selector)
            : element?.children;
    },

    /**
     * Remove element from DOM
     */
    remove: (element) => {
        element?.remove();
    },

    /**
     * Scroll element into view
     */
    scrollIntoView: (element) => {
        element?.scrollIntoView({ behavior: 'smooth' });
    },
};

/**
 * Responsive Utilities
 */
const responsiveUtils = {
    /**
     * Check if mobile
     */
    isMobile: () => window.innerWidth < 768,

    /**
     * Check if tablet
     */
    isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1025,

    /**
     * Check if desktop
     */
    isDesktop: () => window.innerWidth >= 1025,

    /**
     * Get current breakpoint
     */
    getBreakpoint: () => {
        if (responsiveUtils.isMobile()) return 'mobile';
        if (responsiveUtils.isTablet()) return 'tablet';
        return 'desktop';
    },

    /**
     * Watch breakpoint changes
     */
    onBreakpointChange: (callback) => {
        let currentBreakpoint = responsiveUtils.getBreakpoint();

        const handleResize = () => {
            const newBreakpoint = responsiveUtils.getBreakpoint();
            if (newBreakpoint !== currentBreakpoint) {
                currentBreakpoint = newBreakpoint;
                callback(newBreakpoint);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    },
};

/**
 * Export all utilities
 */
window.adminUtils = {
    numberUtils,
    dateUtils,
    stringUtils,
    validationUtils,
    domUtils,
    responsiveUtils,
};
