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
    }

    removeItem(productId, size) {
        this.items = this.items.filter(item => !(item.id === productId && item.size === size));
        this.save();
    }

    updateQuantity(productId, size, quantity) {
        const item = this.items.find(item => item.id === productId && item.size === size);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.save();
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
    }

    save() {
        localStorage.setItem('fjl_cart', JSON.stringify(this.items));
    }
}

// Initialize cart globally only if not already defined
if (typeof cart === 'undefined') {
    const cart = new Cart();
}
