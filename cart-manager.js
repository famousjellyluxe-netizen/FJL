// Centralized Cart Management Class
// Used across all pages (shop, cart, checkout, etc.)

// Create Cart class in a closure to avoid re-declaration issues
(function() {
    // Only declare Cart class if it doesn't exist globally
    if (typeof window.Cart === 'undefined') {
        window.Cart = class {
            constructor() {
                this.items = JSON.parse(localStorage.getItem('fjl_cart')) || [];
                // Normalize all items to ensure they have maxQuantity field
                this.normalizeItems();
            }

            normalizeItems() {
                // Ensure all cart items have maxQuantity field
                // This handles legacy items that were added before the maxQuantity fix
                this.items = this.items.map(item => {
                    if (typeof item.maxQuantity === 'undefined') {
                        console.warn(`⚠️  Normalizing cart item "${item.name}" - missing maxQuantity field`);
                        // Default to current quantity as conservative fallback
                        // This prevents unlimited quantity increases while preserving what they had
                        return {
                            ...item,
                            maxQuantity: item.quantity || 0
                        };
                    }
                    return item;
                });
            }

            addItem(product, skipInventoryCheck = false) {
                // Check inventory before adding to cart (unless already validated)
                if (!skipInventoryCheck && typeof adminDataService !== 'undefined') {
                    const inventoryCheck = adminDataService.checkInventory(product.id, product.size, product.quantity);
                    if (!inventoryCheck.available) {
                        // Emit error event that components can listen to
                        const event = new CustomEvent('inventoryError', {
                            detail: { message: inventoryCheck.message, productId: product.id, size: product.size }
                        });
                        window.dispatchEvent(event);
                        return false;
                    }
                }

                const existingItem = this.items.find(item => item.id === product.id && item.size === product.size && item.color === product.color);

                if (existingItem) {
                    existingItem.quantity += product.quantity;
                } else {
                    this.items.push(product);
                }

                this.save();
                this.dispatchChange();
                return true;
            }

            removeItem(productIdOrIndex, size, color) { // NEW: Add color parameter
                // Support both: removeItem(productId, size, color) and removeItem(index)
                if (typeof productIdOrIndex === 'number') {
                    // Removing by index
                    this.items.splice(productIdOrIndex, 1);
                } else {
                    // Removing by productId, size, and color (for variant-specific matching)
                    this.items = this.items.filter(item => !(item.id === productIdOrIndex && item.size === size && item.color === color));
                }
                this.save();
                this.dispatchChange();
            }

            updateItem(index, updates) {
                // Update cart item by index (for cart.html)
                if (index >= 0 && index < this.items.length) {
                    this.items[index] = { ...this.items[index], ...updates };
                    this.save();
                    this.dispatchChange();
                }
            }

            updateQuantity(productId, size, quantity, color) { // NEW: Add color parameter
                // Find cart item by productId, size, AND color (for variant-specific matching)
                const item = this.items.find(item => item.id === productId && item.size === size && item.color === color);
                if (item) {
                    item.quantity = Math.max(1, quantity);
                    this.save();
                    this.dispatchChange();
                }
            }

            getTotal() {
                return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            }

            getItemCount() {
                return this.items.reduce((count, item) => count + item.quantity, 0);
            }

            clear() {
                this.items = [];
                this.save();
                this.dispatchChange();
            }

            save() {
                localStorage.setItem('fjl_cart', JSON.stringify(this.items));
            }

            dispatchChange() {
                // Dispatch a custom event so other components can listen for cart changes
                const event = new CustomEvent('cartUpdated', {
                    detail: { items: this.items, count: this.getItemCount() }
                });
                window.dispatchEvent(event);
            }
        };
    }

    // Initialize cart globally only if not already defined
    if (!window.cart) {
        window.cart = new window.Cart();
    }

    // Create global reference for backward compatibility
    // This allows code to use 'cart' as if it were a global variable
    window.cart_ref = window.cart;

})();

// Make 'cart' available globally via assignment (this avoids hoisting issues)
window.cart = window.cart;
