// Centralized Cart Management Class
// Used across all pages (shop, cart, checkout, etc.)

class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('fjl_cart')) || [];
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id && item.size === product.size);

        if (existingItem) {
            existingItem.quantity += product.quantity;
        } else {
            this.items.push(product);
        }

        this.save();
        this.dispatchChange();
    }

    removeItem(productId, size) {
        this.items = this.items.filter(item => !(item.id === productId && item.size === size));
        this.save();
        this.dispatchChange();
    }

    updateQuantity(productId, size, quantity) {
        const item = this.items.find(item => item.id === productId && item.size === size);
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
}

// Initialize cart globally only if not already defined
if (typeof cart === 'undefined') {
    var cart = new Cart();
}
