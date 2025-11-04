# How to Use Playwright MCP

### Overview

This document instructs Claude Code on how to use the **Playwright MCP** tools to interact with and verify the fashion brand website (including Paystack integration and admin panel).
Claude must call these tools **after any code change** that affects the frontend, navigation, or logic — to confirm that edits are functional, visible, and error-free.

---

### 🎬 1. Browser Setup & Navigation

Use these tools to open, navigate, and reset browser states during tests.

| Action               | Tool                    | Parameters        | Example                                                       |
| -------------------- | ----------------------- | ----------------- | ------------------------------------------------------------- |
| **Open site / page** | `browser_navigate`      | `url` (string)    | Navigate to the local dev server or deployed URL              |
| **Go back**          | `browser_navigate_back` | none              | Return to previous page (useful after Paystack test redirect) |
| **Resize window**    | `browser_resize`        | `width`, `height` | Resize viewport for responsive tests                          |
| **Close browser**    | `browser_close`         | none              | Always close browser after verification sequence              |

---

### 🧩 2. Interaction & Input Testing

Use these to test buttons, forms, dropdowns, and Paystack triggers.

| Action                         | Tool                                     | Description                                                 |
| ------------------------------ | ---------------------------------------- | ----------------------------------------------------------- |
| **Click buttons or links**     | `browser_click`                          | Simulate user click (e.g. “Add to Cart”, “Checkout”)        |
| **Double-click (if required)** | `browser_click` with `doubleClick: true` | For toggles or image gallery tests                          |
| **Type in input fields**       | `browser_type`                           | Enter text into login, signup, or admin forms               |
| **Fill multiple form fields**  | `browser_fill_form`                      | Fill all form fields at once during checkout or admin login |
| **Select dropdown options**    | `browser_select_option`                  | Choose sizes, colors, or admin filters                      |
| **Handle dialogs**             | `browser_handle_dialog`                  | Accept or dismiss payment confirmation prompts              |
| **Upload files**               | `browser_file_upload`                    | Upload product images in admin panel                        |
| **Hover**                      | `browser_hover`                          | Test hover effects on navigation menus or product cards     |

---

### 👁️ 3. Visual & Content Verification

After any interaction or code change, Claude should confirm the intended UI state.

| Check                          | Tool                             | Description                                                                             |
| ------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------- |
| **Verify text visible**        | `browser_verify_text_visible`    | Confirm labels, messages, or headings appear (e.g. “Payment Successful”, “New Arrival”) |
| **Verify element visible**     | `browser_verify_element_visible` | Confirm presence of buttons, banners, or Paystack iframe                                |
| **Verify element value**       | `browser_verify_value`           | Check form field or checkbox state                                                      |
| **Take screenshot (optional)** | `browser_take_screenshot`        | Capture page view for later inspection                                                  |
| **Get page snapshot**          | `browser_snapshot`               | Capture structured accessibility snapshot to locate elements                            |

---

### 🧠 4. Behavior & Console Validation

After edits, Claude should use these tools to check runtime behavior.

| Check                     | Tool                       | Description                                                               |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| **Check console logs**    | `browser_console_messages` | Detect JS errors, failed network requests, or Paystack integration issues |
| **List network requests** | `browser_network_requests` | Confirm API or Paystack endpoints are called properly                     |
| **Evaluate JavaScript**   | `browser_evaluate`         | Run inline JS to check or manipulate DOM directly                         |
| **Wait for UI changes**   | `browser_wait_for`         | Wait until success messages, modals, or transitions appear/disappear      |

---

### 🧾 5. Testing Assertions

These are used for automated verification and regression testing.

| Action                              | Tool                                                           | Description                                             |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| **Generate locator**                | `browser_generate_locator`                                     | Create reusable locator for elements in test assertions |
| **Verify lists visible**            | `browser_verify_list_visible`                                  | Check product grids, cart items, or admin lists         |
| **Verify text or element sequence** | `browser_verify_text_visible` or `browser_verify_list_visible` | Confirm proper order or visibility of items             |

---

### 🧱 6. Paystack Integration Testing

Use the following sequence to validate Paystack payments:

1. Navigate to product → checkout → payment page.
2. Use `browser_fill_form` to fill in user and card details (mock data).
3. Click the **Pay with Paystack** button using `browser_click`.
4. Wait for the Paystack modal using `browser_wait_for` (text: "Paystack").
5. After simulated payment, verify success message with `browser_verify_text_visible` (“Payment Successful” or “Order Confirmed”).
6. Check network logs via `browser_network_requests` for Paystack callbacks.
7. Close modal using `browser_handle_dialog`.

---

### 🛠️ 7. Admin Panel Testing

Ensure admin features are functional post-deploy.

| Action                         | Tool                                                                             | Description                                       |
| ------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Login to admin panel**       | `browser_fill_form` → `browser_click`                                            | Fill in credentials, click login                  |
| **Verify dashboard elements**  | `browser_verify_list_visible` or `browser_verify_element_visible`                | Confirm products, stats, and controls are visible |
| **Add product test**           | `browser_file_upload` (for images), then `browser_fill_form` for product details |                                                   |
| **Save product**               | `browser_click` → confirm success message                                        |                                                   |
| **Console check**              | `browser_console_messages`                                                       | Confirm no errors on submission                   |
| **Logout and verify redirect** | `browser_click` → `browser_verify_text_visible("Login")`                         |                                                   |

---

### 🔍 8. Error & Regression Checks

After implementing or editing features:

1. Call `browser_console_messages` with `onlyErrors: true` to confirm no console errors.
2. Call `browser_network_requests` to ensure all key endpoints (product list, checkout, Paystack webhook) return 200 OK.
3. Use `browser_verify_text_visible` to check for success or alert messages.
4. Capture `browser_snapshot` for comparison in future tests.

---

### 📄 9. Optional Add-ons

If project uses extra Playwright capabilities:

* **PDF export of receipts or admin reports:** use `browser_pdf_save`
* **Tracing debugging:** use `browser_start_tracing` → perform actions → `browser_stop_tracing`

---

### ✅ Example Test Sequence

```yaml
# Example: Verify checkout flow works end-to-end

- browser_navigate:
    url: "http://localhost:3000"
- browser_click:
    element: "Shop Now button"
    ref: "shop-now-btn"
- browser_click:
    element: "Add to Cart"
    ref: "add-to-cart-btn"
- browser_click:
    element: "Checkout"
    ref: "checkout-btn"
- browser_fill_form:
    fields:
      - name: "Full Name"
        value: "Test User"
      - name: "Email"
        value: "test@example.com"
- browser_click:
    element: "Pay with Paystack"
    ref: "paystack-btn"
- browser_wait_for:
    text: "Payment Successful"
- browser_verify_text_visible:
    text: "Payment Successful"
- browser_console_messages:
    onlyErrors: true
- browser_close
```

---

### 🔐 Notes

* Always ensure `browser_install` is run once per environment setup.
* Use `browser_tabs` if multiple pages (e.g., Paystack modal or admin preview) open simultaneously.
* Prefer `browser_snapshot` over screenshots for structured accessibility testing.
