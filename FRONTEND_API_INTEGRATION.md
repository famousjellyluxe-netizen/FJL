# Frontend API Integration - Quick Reference

## File: `js/api-client.js`

All API calls go through this centralized client. It handles:
- Authentication tokens
- Error handling
- Base URL configuration
- Response formatting

---

## How to Use in Your Pages

### Example 1: Load Products on Home Page

**File: `index.html`**

```html
<!-- At the end of body, before closing tag -->
<script type="module">
  import { productsAPI } from './js/api-client.js';

  async function loadFeaturedProducts() {
    try {
      const response = await productsAPI.getFeatured(6);
      const products = response.data;

      // Clear existing products
      const container = document.getElementById('featured-products');
      container.innerHTML = '';

      // Add each product
      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <img src="${product.image_url}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>₦${product.price.toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
          <button onclick="viewProduct('${product.id}')">View Product</button>
        `;
        container.appendChild(card);
      });
    } catch (error) {
      console.error('Error loading products:', error);
      document.getElementById('featured-products').innerHTML =
        '<p>Error loading products. Please try again later.</p>';
    }
  }

  // Load on page load
  loadFeaturedProducts();

  // Make viewProduct available globally
  window.viewProduct = function(id) {
    window.location.href = `/product.html?id=${id}`;
  };
</script>
```

---

### Example 2: Load Product Details on Product Page

**File: `product.html`**

```html
<script type="module">
  import { productsAPI } from './js/api-client.js';

  async function loadProduct() {
    // Get product ID from URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
      document.getElementById('product-details').innerHTML =
        '<p>Product not found</p>';
      return;
    }

    try {
      const response = await productsAPI.getById(productId);
      const product = response.data;

      // Display product details
      document.getElementById('product-name').textContent = product.name;
      document.getElementById('product-price').textContent =
        `₦${product.price.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
      document.getElementById('product-description').textContent = product.description;
      document.getElementById('product-image').src = product.image_url;

      // Load variants (sizes/colors)
      const variantsResponse = await productsAPI.getVariants(productId);
      const variants = variantsResponse.data;

      displayVariants(variants);
    } catch (error) {
      console.error('Error loading product:', error);
      document.getElementById('product-details').innerHTML =
        '<p>Error loading product. Please try again later.</p>';
    }
  }

  function displayVariants(variants) {
    const sizes = new Set();
    const colors = new Set();

    variants.forEach(v => {
      if (v.size) sizes.add(v.size);
      if (v.color) colors.add(v.color);
    });

    // Display size options
    const sizeSelect = document.getElementById('size-select');
    sizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = size;
      sizeSelect.appendChild(option);
    });

    // Display color options
    const colorSelect = document.getElementById('color-select');
    colors.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = color;
      colorSelect.appendChild(option);
    });
  }

  loadProduct();
</script>
```

---

### Example 3: Create Order on Checkout Page

**File: `checkout.html`**

```html
<script type="module">
  import { ordersAPI, customersAPI, showAPIError } from './js/api-client.js';

  const form = document.getElementById('checkout-form');
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      // Get form data
      const formData = new FormData(form);

      // Prepare order data
      const orderData = {
        items: cart.items || [],
        shipping_email: formData.get('email'),
        shipping_first_name: formData.get('first_name'),
        shipping_last_name: formData.get('last_name'),
        shipping_phone: formData.get('phone'),
        shipping_address: formData.get('address'),
        shipping_city: formData.get('city'),
        shipping_state: formData.get('state'),
        shipping_postal_code: formData.get('postal_code'),
        shipping_country: formData.get('country'),
        buyer_name: `${formData.get('first_name')} ${formData.get('last_name')}`,
        subtotal: cart.subtotal || 0,
        tax: cart.tax || 0,
        shipping_cost: 0,
        total_amount: cart.total || 0,
        payment_method: 'bank_transfer'
      };

      // Validate cart is not empty
      if (!orderData.items || orderData.items.length === 0) {
        alert('Your cart is empty!');
        return;
      }

      // Create order
      const response = await ordersAPI.create(orderData);
      const order = response.data;

      // Clear cart
      localStorage.removeItem('cart');

      // Show success
      alert(`Order created! Order number: ${order.order_number}`);

      // Redirect to confirmation
      window.location.href = `/order-confirmation.html?order_id=${order.id}`;
    } catch (error) {
      showAPIError(error);
      alert(`Error creating order: ${error.message}`);
    }
  });
</script>
```

---

### Example 4: Display Order Confirmation

**File: `order-confirmation.html`**

```html
<script type="module">
  import { ordersAPI } from './js/api-client.js';

  async function loadOrder() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');

    if (!orderId) {
      document.getElementById('order-details').innerHTML =
        '<p>Order not found</p>';
      return;
    }

    try {
      const response = await ordersAPI.getById(orderId);
      const order = response.data;

      // Display order number
      document.getElementById('order-number').textContent = order.order_number;

      // Display items
      const itemsList = document.getElementById('order-items');
      itemsList.innerHTML = '';

      (order.order_items || []).forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';
        itemDiv.innerHTML = `
          <p><strong>${item.product_name}</strong></p>
          <p>Size: ${item.size}, Color: ${item.color || 'N/A'}</p>
          <p>Qty: ${item.quantity} x ₦${item.unit_price.toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
          <p>Subtotal: ₦${item.total_price.toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
        `;
        itemsList.appendChild(itemDiv);
      });

      // Display totals
      document.getElementById('subtotal').textContent =
        `₦${order.subtotal.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
      document.getElementById('tax').textContent =
        `₦${order.tax.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
      document.getElementById('total').textContent =
        `₦${order.total_amount.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;

      // Display shipping address
      document.getElementById('shipping-address').innerHTML = `
        <p>${order.shipping_first_name} ${order.shipping_last_name}</p>
        <p>${order.shipping_address}</p>
        <p>${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}</p>
        <p>${order.shipping_country}</p>
      `;

      // Display status
      document.getElementById('order-status').textContent =
        order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1);

    } catch (error) {
      console.error('Error loading order:', error);
      document.getElementById('order-details').innerHTML =
        '<p>Error loading order. Please try again later.</p>';
    }
  }

  loadOrder();
</script>
```

---

### Example 5: Newsletter Signup

**File: `Any page with newsletter form`**

```html
<form id="newsletter-form">
  <input type="email" name="email" placeholder="Enter your email" required>
  <input type="text" name="name" placeholder="Your name (optional)">
  <button type="submit">Subscribe</button>
</form>

<script type="module">
  import { customersAPI, showAPISuccess, showAPIError } from './js/api-client.js';

  const form = document.getElementById('newsletter-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const email = form.email.value;
      const name = form.name.value || null;

      const response = await customersAPI.subscribeNewsletter(email, name);

      if (response.success) {
        showAPISuccess('Thank you for subscribing!');
        form.reset();
      }
    } catch (error) {
      showAPIError(error);
      alert(`Error: ${error.message}`);
    }
  });
</script>
```

---

### Example 6: Add to Cart with API Validation

**File: `product.html`**

```javascript
// Before adding to cart, verify product exists
async function addToCart(productId) {
  try {
    // Verify product exists
    const response = await productsAPI.getById(productId);
    const product = response.data;

    // Get selected variant
    const size = document.getElementById('size-select').value;
    const color = document.getElementById('color-select').value;
    const quantity = parseInt(document.getElementById('quantity-input').value);

    if (!size) {
      alert('Please select a size');
      return;
    }

    // Get variant details
    const variantsResponse = await productsAPI.getVariants(productId);
    const variants = variantsResponse.data;

    const selectedVariant = variants.find(v =>
      v.size === size && (!color || v.color === color)
    );

    if (!selectedVariant) {
      alert('This combination is not available');
      return;
    }

    if (selectedVariant.stock_quantity < quantity) {
      alert('Not enough stock available');
      return;
    }

    // Add to cart
    let cart = JSON.parse(localStorage.getItem('cart') || '{}');
    if (!cart.items) cart.items = [];

    const cartItem = {
      product_id: productId,
      product_name: product.name,
      product_sku: product.sku,
      variant_id: selectedVariant.id,
      size: size,
      color: color || null,
      unit_price: product.price,
      quantity: quantity,
      total_price: product.price * quantity,
      image_url: product.image_url
    };

    // Check if already in cart
    const existingItem = cart.items.find(item =>
      item.product_id === productId &&
      item.size === size &&
      item.color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total_price = existingItem.unit_price * existingItem.quantity;
    } else {
      cart.items.push(cartItem);
    }

    // Update totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    cart.tax = cart.subtotal * 0.075; // 7.5% tax
    cart.total = cart.subtotal + cart.tax;

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');

  } catch (error) {
    console.error('Error adding to cart:', error);
    alert(`Error: ${error.message}`);
  }
}
```

---

## API Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## Accessing API Data

```javascript
// Get list of products
const response = await productsAPI.getAll();
const products = response.data;
const pagination = response.pagination;

// Get single product
const response = await productsAPI.getById('product-id');
const product = response.data;

// Create order
const response = await ordersAPI.create(orderData);
const order = response.data;
console.log(`Order created: ${order.order_number}`);
```

---

## Error Handling

```javascript
try {
  const response = await productsAPI.getAll();
} catch (error) {
  console.log(error.status);      // HTTP status code
  console.log(error.message);     // Error message
  console.log(error.details);     // Validation details
}
```

---

## Important Notes

1. **Cart Storage**: Items are stored in `localStorage.cart` as JSON
2. **Totals Calculation**:
   - TAX_RATE = 7.5% (from backend env)
   - Shipping = 0 (free shipping)
   - Total = subtotal + tax + shipping
3. **Product Images**: Use `product.image_url` for single image, `product.images` for array
4. **Variants**: Each product variant is a separate inventory item
5. **Authentication**: Only admin endpoints require login (use authAPI.login)

---

## Testing Checklist

- [ ] Load featured products on homepage
- [ ] Load product details on product page
- [ ] Add products to cart and calculate totals
- [ ] Create order with checkout form
- [ ] Verify email confirmation is sent
- [ ] Newsletter subscription works
- [ ] Order history loads on customer orders page
- [ ] All product prices display correctly
- [ ] Stock availability is verified before checkout

---

**Happy integrating! 🚀**
