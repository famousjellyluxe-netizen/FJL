# Admin Panel - CSP Refactoring Guide

**Status**: PENDING
**Violations Found**: 23 across 9 admin files
**Estimated Effort**: 2-3 hours
**Priority**: HIGH

---

## Quick Reference

### Before & After Pattern

```html
<!-- BEFORE (CSP Violation) -->
<button onclick="deleteItem(${id})">Delete</button>
<form onsubmit="saveSettings(event)">
<img onerror="this.src='placeholder.png'" src="...">

<!-- AFTER (CSP Compliant) -->
<button type="button" data-action="delete-item" data-id="${id}">Delete</button>
<form id="settingsForm">
<img class="image-with-fallback" src="...">
```

### JavaScript Handler (use this pattern for all pages)

```javascript
// Add this to each admin page's script section
document.addEventListener('click', function(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    const index = target.dataset.index;

    switch(action) {
        case 'edit-item':
            editItem(id);
            break;
        case 'delete-item':
            deleteItem(id);
            break;
        // Add more cases as needed
    }
});
```

---

## File-by-File Refactoring

### 1. admin/categories.html - 6 violations

**Violations:**
- Line 494: `onclick="closeCategoryModal()"`
- Line 520: `onclick="closeCategoryModal()"` (button tag)
- Line 531: `onclick="closeDeleteModal()"`
- Line 539: `onclick="closeDeleteModal()"` (button tag)
- Line 674: `onclick="categoriesManager.editCategory('${category.id}')"` (dynamic)
- Line 675: `onclick="categoriesManager.deleteCategory('${category.id}')"` (dynamic)

**Refactoring Steps:**

1. **Line 494**: Replace button
   ```html
   <!-- Before -->
   <button class="modal-close" onclick="closeCategoryModal()">×</button>

   <!-- After -->
   <button type="button" class="modal-close" data-action="close-category-modal">×</button>
   ```

2. **Lines 531, 539**: Replace delete modal buttons
   ```html
   <!-- Before -->
   <button class="modal-close" onclick="closeDeleteModal()">×</button>
   <button class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>

   <!-- After -->
   <button type="button" class="modal-close" data-action="close-delete-modal">×</button>
   <button type="button" class="btn btn-secondary" data-action="close-delete-modal">Cancel</button>
   ```

3. **Lines 674-675**: Replace in HTML template string
   ```javascript
   // Before (in template)
   onclick="categoriesManager.editCategory('${category.id}')"
   onclick="categoriesManager.deleteCategory('${category.id}')"

   // After (in template)
   data-action="edit-category" data-category-id="${category.id}"
   data-action="delete-category" data-category-id="${category.id}"
   ```

4. **Add event handler** (at end of script section):
   ```javascript
   // Event delegation for category actions
   document.addEventListener('click', (e) => {
       const target = e.target.closest('[data-action]');
       if (!target) return;

       const action = target.dataset.action;
       const categoryId = target.dataset.categoryId;

       switch (action) {
           case 'close-category-modal':
               closeCategoryModal();
               break;
           case 'close-delete-modal':
               closeDeleteModal();
               break;
           case 'edit-category':
               if (categoryId) categoriesManager.editCategory(categoryId);
               break;
           case 'delete-category':
               if (categoryId) categoriesManager.deleteCategory(categoryId);
               break;
       }
   });
   ```

---

### 2. admin/product-add.html - 1 violation

**Violation:**
- Line 102: `<form id="productForm" onsubmit="saveProduct(event)">`

**Refactoring Steps:**

1. **Remove onsubmit attribute:**
   ```html
   <!-- Before -->
   <form id="productForm" onsubmit="saveProduct(event)">

   <!-- After -->
   <form id="productForm">
   ```

2. **Check if addEventListener already exists** (usually at line ~269):
   ```javascript
   // Look for:
   const form = document.getElementById('productForm');
   form?.addEventListener('submit', saveProduct);
   ```

   If it doesn't exist, add it:
   ```javascript
   document.addEventListener('DOMContentLoaded', function() {
       const form = document.getElementById('productForm');
       if (form) {
           form.addEventListener('submit', saveProduct);
       }
   });
   ```

---

### 3. admin/product-announcements.html - 4 violations

**Violations:**
- Line 30: `onclick="logoutAdmin()"`
- Line 43: `onclick="toggleSidebar()"`
- Line 80: `onclick="sendAnnouncement()"`
- Line 113: `onclick="window.location.reload()"`

**Refactoring Steps:**

1. **Line 30**: Logout button
   ```html
   <!-- Before -->
   <button class="btn btn-secondary btn-sm btn-block" onclick="logoutAdmin()">Logout</button>

   <!-- After -->
   <button type="button" class="btn btn-secondary btn-sm btn-block" data-action="logout">Logout</button>
   ```

2. **Line 43**: Sidebar toggle
   ```html
   <!-- Before -->
   <button class="header-icon-btn" onclick="toggleSidebar()">≡</button>

   <!-- After -->
   <button type="button" class="header-icon-btn" data-action="toggle-sidebar" title="Menu">≡</button>
   ```

3. **Line 80**: Send announcement button
   ```html
   <!-- Before -->
   <button class="btn btn-accent" id="sendAnnouncementBtn" onclick="sendAnnouncement()" disabled>

   <!-- After -->
   <button type="button" class="btn btn-accent" id="sendAnnouncementBtn" data-action="send-announcement" disabled>
   ```

4. **Line 113**: Reload page button
   ```html
   <!-- Before -->
   <button class="btn btn-accent" onclick="window.location.reload()">View Updated Products</button>

   <!-- After -->
   <button type="button" class="btn btn-accent" data-action="reload-page">View Updated Products</button>
   ```

5. **Add event handler**:
   ```javascript
   document.addEventListener('click', (e) => {
       const target = e.target.closest('[data-action]');
       if (!target) return;

       const action = target.dataset.action;

       switch (action) {
           case 'logout':
               logoutAdmin();
               break;
           case 'toggle-sidebar':
               toggleSidebar();
               break;
           case 'send-announcement':
               sendAnnouncement();
               break;
           case 'reload-page':
               window.location.reload();
               break;
       }
   });
   ```

---

### 4. admin/settings.html - 5 violations

**Violations:**
- Line 153: `onclick="settingsManager.saveStore()"`
- Line 190: `onclick="settingsManager.savePagination()"`
- Line 210: `onclick="settingsManager.saveFile()"`
- Line 236: `onclick="settingsManager.saveCurrency()"`
- Line 270: `onclick="settingsManager.changePassword()"`

**Refactoring Steps:**

Replace all onclick attributes with data-action:

```html
<!-- Before -->
<button type="button" class="btn-save" onclick="settingsManager.saveStore()">Save Store Settings</button>
<button type="button" class="btn-save" onclick="settingsManager.savePagination()">Save Pagination Settings</button>
<button type="button" class="btn-save" onclick="settingsManager.saveFile()">Save File Settings</button>
<button type="button" class="btn-save" onclick="settingsManager.saveCurrency()">Save Currency Settings</button>
<button type="button" class="btn-save" onclick="settingsManager.changePassword()">Update Password</button>

<!-- After -->
<button type="button" class="btn-save" data-action="save-store">Save Store Settings</button>
<button type="button" class="btn-save" data-action="save-pagination">Save Pagination Settings</button>
<button type="button" class="btn-save" data-action="save-file">Save File Settings</button>
<button type="button" class="btn-save" data-action="save-currency">Save Currency Settings</button>
<button type="button" class="btn-save" data-action="change-password">Update Password</button>
```

Add event handler:

```javascript
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    if (typeof settingsManager === 'undefined') return;

    switch (action) {
        case 'save-store':
            settingsManager.saveStore();
            break;
        case 'save-pagination':
            settingsManager.savePagination();
            break;
        case 'save-file':
            settingsManager.saveFile();
            break;
        case 'save-currency':
            settingsManager.saveCurrency();
            break;
        case 'change-password':
            settingsManager.changePassword();
            break;
    }
});
```

---

### 5. admin/orders.html - 1 violation

**Violation:**
- Line 668: `onclick="closeOrderDetail()"`

**Refactoring Steps:**

```html
<!-- Before -->
<button class="modal-close" onclick="closeOrderDetail()">×</button>

<!-- After -->
<button type="button" class="modal-close" data-action="close-order-detail">×</button>
```

Add event handler:

```javascript
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'close-order-detail') {
        closeOrderDetail();
    }
});
```

---

### 6. admin/index.html - 1 violation

**Violation:**
- Line 149: `onclick="notifications.info('...'); return false;"`

**Refactoring Steps:**

```html
<!-- Before -->
<a href="#" onclick="notifications.info('Password reset functionality coming soon!'); return false;">

<!-- After -->
<a href="#" data-action="show-password-reset-info">
```

Add event handler:

```javascript
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'show-password-reset-info') {
        e.preventDefault();
        if (notifications) {
            notifications.info('Password reset functionality coming soon!');
        }
    }
});
```

---

### 7. admin/analytics.html - 2 violations

**Violations:**
- Line 31: `onclick="logoutAdmin()"`
- Line 38: `onclick="toggleSidebar()"`

**Refactoring Steps:**

Same as product-announcements.html (#3) - just these two buttons.

```html
<!-- Before -->
<button class="btn" onclick="logoutAdmin()">Logout</button>
<button class="icon-btn" onclick="toggleSidebar()">≡</button>

<!-- After -->
<button type="button" class="btn" data-action="logout">Logout</button>
<button type="button" class="icon-btn" data-action="toggle-sidebar">≡</button>
```

Add event handler:

```javascript
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'logout') {
        logoutAdmin();
    } else if (target.dataset.action === 'toggle-sidebar') {
        toggleSidebar();
    }
});
```

---

### 8. admin/components/Modal.html - 2 violations

**Violations:**
- Line 355: `onclick="closeModal()"`
- Line 378: `onclick="closeModal()"`

**Refactoring Steps:**

```html
<!-- Before -->
<button class="modal-close" onclick="closeModal()">×</button>
<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>

<!-- After -->
<button type="button" class="modal-close" data-action="close-modal">×</button>
<button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
```

Add event handler:

```javascript
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'close-modal') {
        closeModal();
    }
});
```

---

### 9. admin/components/ResponsiveTable.html - 1 violation

**Violation:**
- Line 401: `onclick="toggleRowDetails(this)"`

**Refactoring Steps:**

```html
<!-- Before -->
<button class="expand-btn" onclick="toggleRowDetails(this)">▼</button>

<!-- After -->
<button type="button" class="expand-btn" data-action="toggle-row-details">▼</button>
```

Add event handler:

```javascript
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'toggle-row-details') {
        toggleRowDetails(target);
    }
});
```

---

## Testing Checklist - Admin Side

- [ ] Categories: Add, Edit, Delete categories
- [ ] Categories: Modal open/close works
- [ ] Products: Create new product
- [ ] Products: Edit existing product
- [ ] Products: Delete product
- [ ] Settings: Save all settings pages
- [ ] Settings: Change password
- [ ] Orders: View order details
- [ ] Orders: Close order modal
- [ ] Announcements: Send announcement
- [ ] Analytics: View analytics data
- [ ] Sidebar: Toggle sidebar menu
- [ ] Logout: Logout button works
- [ ] Images: Image errors show fallback
- [ ] Forms: All form submissions work

---

## Implementation Order

**Recommended order for implementation:**

1. **admin/settings.html** (5 violations) - Simplest pattern
2. **admin/categories.html** (6 violations) - Dynamic content handling
3. **admin/product-announcements.html** (4 violations) - Multiple actions
4. **admin/product-add.html** (1 violation) - Form only
5. **Remaining files** (1-2 violations each)

**Estimated time:**
- Each file: 10-15 minutes
- Total: 2-3 hours for all 9 files

---

## Verification

After completing refactoring, verify:

```bash
# No CSP violations in console
grep -r "onclick=" admin/*.html  # Should return ZERO results
grep -r "onsubmit=" admin/*.html # Should return ZERO results
grep -r "onerror=" admin/*.html  # Should return ZERO results
grep -r "onchange=" admin/*.html # Should return ZERO results
```

---

## Notes

- ✅ Use same event delegation pattern for all pages
- ✅ Add `type="button"` to all buttons to prevent form submission
- ✅ Use data attributes for passing parameters (safer than inline code)
- ✅ Test thoroughly after each file
- ✅ Check browser console for CSP violations

---

**Status**: READY FOR IMPLEMENTATION

Next: Apply these patterns to all 9 admin files
