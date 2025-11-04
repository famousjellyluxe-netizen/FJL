// Cart Drawer Functionality
// This file handles the side drawer cart that slides in from the right

class CartDrawer {
    constructor() {
        this.drawer = null;
        this.overlay = null;
        this.init();
    }

    init() {
        // Create drawer HTML if it doesn't exist
        if (!document.getElementById('cartDrawer')) {
            this.createDrawer();
        }

        this.drawer = document.getElementById('cartDrawer');
        this.overlay = document.getElementById('cartOverlay');

        // Add event listeners
        this.addEventListeners();
        this.render();

        // Listen for cart updates from other pages/components
        window.addEventListener('cartUpdated', () => {
            this.render();
        });
    }

    createDrawer() {
        const drawerHTML = `
            <!-- Cart Overlay -->
            <div id="cartOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 99;
                display: none;
                transition: opacity 0.3s ease;
            "></div>

            <!-- Cart Drawer -->
            <div id="cartDrawer" style="
                position: fixed;
                top: 0;
                right: 0;
                width: 100%;
                max-width: 420px;
                height: 100vh;
                background: white;
                box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
                z-index: 100;
                display: flex;
                flex-direction: column;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                overflow: hidden;
            ">
                <!-- Cart Header -->
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid #e5e5e5;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                ">
                    <h2 style="
                        font-family: 'Poppins', sans-serif;
                        font-size: 18px;
                        font-weight: 700;
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    ">Shopping Cart</h2>
                    <button id="closeCartDrawer" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #000;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>

                <!-- Cart Items -->
                <div id="cartItemsContainer" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                "></div>

                <!-- Empty Cart Message -->
                <div id="emptyCartMessage" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    text-align: center;
                    display: none;
                ">
                    <div style="
                        font-size: 48px;
                        margin-bottom: 16px;
                    ">🛒</div>
                    <p style="
                        font-size: 16px;
                        color: #666;
                        margin: 0;
                    ">Your cart is empty</p>
                    <p style="
                        font-size: 12px;
                        color: #999;
                        margin: 8px 0 0 0;
                    ">Add items to get started</p>
                </div>

                <!-- Cart Footer -->
                <div style="
                    padding: 20px;
                    border-top: 1px solid #e5e5e5;
                    background: white;
                ">
                    <!-- Cart Total -->
                    <div id="cartTotal" style="
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        padding-bottom: 16px;
                        border-bottom: 1px solid #e5e5e5;
                    ">
                        <span style="
                            font-weight: 600;
                            font-size: 14px;
                            text-transform: uppercase;
                        ">Total:</span>
                        <span style="
                            font-weight: 700;
                            font-size: 16px;
                        ">₦<span id="totalAmount">0.00</span></span>
                    </div>

                    <!-- Action Buttons -->
                    <div style="
                        display: flex;
                        gap: 12px;
                        flex-direction: column;
                    ">
                        <button id="continueShopping" style="
                            width: 100%;
                            padding: 12px 16px;
                            background: white;
                            color: black;
                            border: 2px solid #000;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">Continue Shopping</button>
                        <button id="viewSummary" style="
                            width: 100%;
                            padding: 12px 16px;
                            background: #E09F3E;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">View Summary</button>
                        <button id="goToCheckout" style="
                            width: 100%;
                            padding: 12px 16px;
                            background: #000;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">Proceed to Checkout</button>
                        <button id="clearCart" style="
                            width: 100%;
                            padding: 12px 16px;
                            background: white;
                            color: #999;
                            border: 1px solid #e5e5e5;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">Clear Cart</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', drawerHTML);
    }

    addEventListeners() {
        // Close button
        document.getElementById('closeCartDrawer').addEventListener('click', () => this.close());

        // Overlay click
        document.getElementById('cartOverlay').addEventListener('click', () => this.close());

        // Continue shopping button
        document.getElementById('continueShopping').addEventListener('click', () => {
            window.location.href = 'shop.html';
        });

        // View summary button
        document.getElementById('viewSummary').addEventListener('click', () => {
            window.location.href = 'cart.html';
        });

        // Checkout button
        document.getElementById('goToCheckout').addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });

        // Clear cart button
        document.getElementById('clearCart').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your cart?')) {
                const cart = new Cart();
                cart.clear();
                this.render();
                updateCartBadge();
            }
        });

        // Cart icon click (handle on each page)
        const cartIcons = document.querySelectorAll('a[href="cart.html"]');
        cartIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        });

        // Cart items button listeners (quantity +/- and remove)
        const itemsContainer = document.getElementById('cartItemsContainer');
        if (itemsContainer) {
            itemsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-decrease], [data-increase], [data-remove]');

                if (!btn) return;

                e.preventDefault();

                if (btn.hasAttribute('data-decrease')) {
                    const productId = btn.getAttribute('data-product-id');
                    const size = btn.getAttribute('data-size');
                    const currentQty = parseInt(btn.getAttribute('data-qty'));
                    console.log('Decrease clicked:', productId, size, currentQty);
                    this.updateQuantity(productId, size, currentQty - 1);
                }

                if (btn.hasAttribute('data-increase')) {
                    const productId = btn.getAttribute('data-product-id');
                    const size = btn.getAttribute('data-size');
                    const currentQty = parseInt(btn.getAttribute('data-qty'));
                    console.log('Increase clicked:', productId, size, currentQty);
                    this.updateQuantity(productId, size, currentQty + 1);
                }

                if (btn.hasAttribute('data-remove')) {
                    const productId = btn.getAttribute('data-product-id');
                    const size = btn.getAttribute('data-size');
                    console.log('Remove clicked:', productId, size);
                    this.removeItem(productId, size);
                }
            });
        }
    }

    render() {
        const cart = new Cart();
        const itemsContainer = document.getElementById('cartItemsContainer');
        const emptyMessage = document.getElementById('emptyCartMessage');

        if (cart.items.length === 0) {
            itemsContainer.innerHTML = '';
            emptyMessage.style.display = 'flex';
            document.getElementById('cartTotal').style.display = 'none';
            document.getElementById('goToCheckout').style.opacity = '0.5';
            document.getElementById('goToCheckout').style.cursor = 'not-allowed';
            document.getElementById('goToCheckout').disabled = true;
        } else {
            emptyMessage.style.display = 'none';
            document.getElementById('cartTotal').style.display = 'flex';
            document.getElementById('goToCheckout').style.opacity = '1';
            document.getElementById('goToCheckout').style.cursor = 'pointer';
            document.getElementById('goToCheckout').disabled = false;

            // Calculate subtotal (no tax in cart drawer)
            let subtotal = 0;
            cart.items.forEach(item => {
                subtotal += item.price * item.quantity;
            });

            let itemsHTML = '';
            cart.items.forEach(item => {
                const itemTotal = item.price * item.quantity;
                itemsHTML += `
                    <div style="
                        display: flex;
                        gap: 12px;
                        margin-bottom: 16px;
                        padding-bottom: 16px;
                        border-bottom: 1px solid #e5e5e5;
                    ">
                        <!-- Product Image -->
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: #f5f5f5;
                            border-radius: 4px;
                            flex-shrink: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 32px; height: 32px; color: #ccc;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>

                        <!-- Product Details -->
                        <div style="flex: 1;">
                            <h3 style="
                                font-size: 13px;
                                font-weight: 600;
                                margin: 0 0 4px 0;
                                text-transform: uppercase;
                            ">${item.name}</h3>
                            <p style="
                                font-size: 11px;
                                color: #666;
                                margin: 0 0 8px 0;
                            ">Size: ${item.size}</p>
                            <p style="
                                font-size: 13px;
                                font-weight: 600;
                                margin: 0;
                            ">₦${item.price.toLocaleString('en-NG')}</p>

                            <!-- Quantity Controls -->
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-top: 8px;
                            ">
                                <button data-decrease data-product-id="${item.id}" data-size="${item.size}" data-qty="${item.quantity}" style="
                                    width: 24px;
                                    height: 24px;
                                    border: 1px solid #e5e5e5;
                                    background: white;
                                    cursor: pointer;
                                    font-size: 12px;
                                    border-radius: 2px;
                                ">−</button>
                                <span style="
                                    min-width: 24px;
                                    text-align: center;
                                    font-size: 12px;
                                    font-weight: 600;
                                ">${item.quantity}</span>
                                <button data-increase data-product-id="${item.id}" data-size="${item.size}" data-qty="${item.quantity}" style="
                                    width: 24px;
                                    height: 24px;
                                    border: 1px solid #e5e5e5;
                                    background: white;
                                    cursor: pointer;
                                    font-size: 12px;
                                    border-radius: 2px;
                                ">+</button>
                                <button data-remove data-product-id="${item.id}" data-size="${item.size}" style="
                                    margin-left: auto;
                                    background: none;
                                    border: none;
                                    color: #999;
                                    cursor: pointer;
                                    font-size: 18px;
                                    padding: 0;
                                ">×</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            itemsContainer.innerHTML = itemsHTML;

            // Update subtotal (no tax in cart drawer)
            document.getElementById('totalAmount').textContent = subtotal.toLocaleString('en-NG', {minimumFractionDigits: 2});
        }
    }

    updateQuantity(productId, size, newQuantity) {
        console.log('updateQuantity called with:', productId, size, newQuantity);
        const cart = new Cart();
        if (newQuantity > 0) {
            console.log('Updating quantity for:', productId, size, 'to:', newQuantity);
            cart.updateQuantity(productId, size, newQuantity);
            this.render();
            updateCartBadge();
        }
    }

    removeItem(productId, size) {
        console.log('removeItem called with:', productId, size);
        const cart = new Cart();
        cart.removeItem(productId, size);
        this.render();
        updateCartBadge();
    }

    open() {
        this.drawer.style.transform = 'translateX(0)';
        this.overlay.style.display = 'block';
        this.overlay.style.opacity = '1';
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.drawer.style.transform = 'translateX(100%)';
        this.overlay.style.display = 'none';
        this.overlay.style.opacity = '0';
        document.body.style.overflow = 'auto';
    }

    toggle() {
        if (this.drawer.style.transform === 'translateX(0px)') {
            this.close();
        } else {
            this.open();
        }
    }
}

// Initialize cart drawer globally
let cartDrawerInstance;
document.addEventListener('DOMContentLoaded', () => {
    cartDrawerInstance = new CartDrawer();
});
