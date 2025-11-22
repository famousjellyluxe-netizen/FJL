/**
 * UI Components for Shopping Page
 * Includes skeleton loaders, pagination UI, and utility functions
 */

(function() {
  'use strict';

  /**
   * Create skeleton loader HTML
   * Displays animated placeholders while products load
   */
  function createSkeletonLoader() {
    return `
      <div class="skeleton-loader">
        <div class="skeleton-image"></div>
        <div class="skeleton-text skeleton-title"></div>
        <div class="skeleton-text skeleton-price"></div>
      </div>
    `;
  }

  /**
   * Create skeleton grid (12 items for one page)
   */
  window.createSkeletonGrid = function() {
    const grid = document.createElement('div');
    grid.className = 'product-grid-skeleton';

    let html = '';
    for (let i = 0; i < 12; i++) {
      html += createSkeletonLoader();
    }

    grid.innerHTML = html;
    return grid;
  };

  /**
   * Create Load More button
   */
  window.createLoadMoreButton = function(state = {}) {
    const { currentPage, totalPages, isLoading } = state;
    const btn = document.createElement('button');
    btn.id = 'load-more-btn';
    btn.className = 'load-more-btn';
    btn.textContent = isLoading ? 'Loading...' : 'Load More Products';
    btn.disabled = isLoading || currentPage >= totalPages;
    return btn;
  };

  /**
   * Create pagination info display
   */
  window.createPaginationInfo = function(state = {}) {
    const { currentPage, totalPages, total, limit } = state;
    const itemsShown = currentPage * limit;
    const displayTotal = Math.min(itemsShown, total);

    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.textContent = `Showing ${displayTotal} of ${total} products`;
    return info;
  };

  /**
   * Show loading indicator
   */
  window.showLoadingIndicator = function(container) {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
      <div class="spinner"></div>
      <p>Loading more products...</p>
    `;
    container.appendChild(indicator);
    return indicator;
  };

  /**
   * Remove loading indicator
   */
  window.removeLoadingIndicator = function(container) {
    const indicator = container.querySelector('.loading-indicator');
    if (indicator) {
      indicator.remove();
    }
  };

  /**
   * Add CSS styles for skeletons and UI components
   */
  window.initializeUIStyles = function() {
    if (document.getElementById('fjl-ui-styles')) {
      return; // Already added
    }

    const style = document.createElement('style');
    style.id = 'fjl-ui-styles';
    style.textContent = `
      /* Skeleton Loader Styles */
      .skeleton-loader {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: #f5f5f5;
        border-radius: 8px;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
      }

      .skeleton-image {
        width: 100%;
        height: 200px;
        background: #e0e0e0;
        border-radius: 4px;
      }

      .skeleton-text {
        height: 16px;
        background: #e0e0e0;
        border-radius: 4px;
      }

      .skeleton-title {
        width: 100%;
        height: 20px;
      }

      .skeleton-price {
        width: 60%;
        height: 18px;
      }

      .product-grid-skeleton {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        padding: 20px;
      }

      /* Load More Button */
      .load-more-btn {
        display: block;
        margin: 40px auto;
        padding: 14px 40px;
        background: #000;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .load-more-btn:hover:not(:disabled) {
        background: #333;
        transform: translateY(-2px);
      }

      .load-more-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      /* Pagination Info */
      .pagination-info {
        text-align: center;
        color: #666;
        font-size: 14px;
        margin: 20px 0;
        padding: 10px;
      }

      /* Loading Indicator */
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 12px;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-indicator p {
        color: #666;
        font-size: 14px;
        margin: 0;
      }

      /* Lazy loading image placeholder */
      img[data-src] {
        background: #f0f0f0;
      }
    `;
    document.head.appendChild(style);
  };
})();
