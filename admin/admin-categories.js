/**
 * Admin Categories Management Service
 * Handles all category operations from the admin panel
 */

const API_BASE = 'http://localhost:5001/api';

let currentEditingId = null;
let currentDeleteId = null;
let allCategories = [];
let draggedItem = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  loadCategories();
  lucide.createIcons();
});

// ============================================================================
// AUTHENTICATION
// ============================================================================

function checkAdminAuth() {
  const token = localStorage.getItem('fjl_admin_token');
  const adminData = localStorage.getItem('fjl_admin');

  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  if (adminData) {
    const admin = JSON.parse(adminData);
    document.getElementById('adminName').textContent = admin.email.split('@')[0];
  }
}

function logoutAdmin() {
  localStorage.removeItem('fjl_admin_token');
  localStorage.removeItem('fjl_admin');
  sessionStorage.removeItem('fjl_admin_authenticated');
  window.location.href = 'index.html';
}

// ============================================================================
// DATA OPERATIONS
// ============================================================================

async function loadCategories() {
  try {
    const token = localStorage.getItem('fjl_admin_token');

    const response = await fetch(`${API_BASE}/categories?include_archived=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showError('Failed to load categories: ' + (data.error || response.statusText));
      return;
    }

    allCategories = data.data || [];
    renderCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    showError('Failed to load categories: ' + error.message);
  }
}

async function saveCategory(event) {
  event.preventDefault();

  const name = document.getElementById('categoryName').value.trim();
  const slug = document.getElementById('categorySlug').value.trim();
  const description = document.getElementById('categoryDescription').value.trim();

  // Clear previous errors
  clearErrors();

  // Validate
  if (!name) {
    showError('Category name is required', 'nameError');
    return;
  }

  if (name.length > 100) {
    showError('Category name must not exceed 100 characters', 'nameError');
    return;
  }

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    showError('Slug must contain only lowercase letters, numbers, and hyphens', 'slugError');
    return;
  }

  if (description && description.length > 1000) {
    showError('Description must not exceed 1000 characters', 'descriptionError');
    return;
  }

  try {
    showLoadingState(true);

    const token = localStorage.getItem('fjl_admin_token');
    const payload = {
      name,
      description: description || null
    };

    // Only include slug if provided
    if (slug) {
      payload.slug = slug;
    }

    let response;
    if (currentEditingId) {
      // Update existing category
      response = await fetch(`${API_BASE}/categories/${currentEditingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Create new category
      response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      showError(result.error || result.message || 'Failed to save category');
      return;
    }

    showSuccess(currentEditingId ? 'Category updated successfully' : 'Category created successfully');
    closeModal();
    loadCategories();
  } catch (error) {
    console.error('Error saving category:', error);
    showError('Failed to save category: ' + error.message);
  } finally {
    showLoadingState(false);
  }
}

async function deleteCategory(id) {
  try {
    showLoadingState(true);

    const token = localStorage.getItem('fjl_admin_token');
    const reassignCheckbox = document.getElementById('reassignCheckbox');
    const reassignTarget = document.getElementById('reassignTarget');

    let queryString = '';
    if (reassignCheckbox.checked && reassignTarget.value) {
      queryString = `?reassign_to=${reassignTarget.value}`;
    }

    const response = await fetch(`${API_BASE}/categories/${id}${queryString}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      showError(result.error || result.message || 'Failed to delete category');
      return;
    }

    showSuccess('Category deleted successfully');
    closeDeleteModal();
    loadCategories();
  } catch (error) {
    console.error('Error deleting category:', error);
    showError('Failed to delete category: ' + error.message);
  } finally {
    showLoadingState(false);
  }
}

async function updateCategoryOrder(categoryIds) {
  try {
    const token = localStorage.getItem('fjl_admin_token');

    const response = await fetch(`${API_BASE}/categories/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: categoryIds })
    });

    const result = await response.json();

    if (!response.ok) {
      showError(result.error || result.message || 'Failed to update category order');
      return;
    }

    showSuccess('Categories reordered successfully');
    loadCategories();
  } catch (error) {
    console.error('Error updating category order:', error);
    showError('Failed to update category order: ' + error.message);
  }
}

// ============================================================================
// UI OPERATIONS
// ============================================================================

function renderCategories() {
  const container = document.getElementById('categoriesContainer');

  if (!allCategories || allCategories.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <h3>No categories yet</h3>
        <p>Create your first category to get started</p>
        <button class="btn btn-accent" style="margin-top: var(--spacing-md);" onclick="openCreateModal()">
          Create Category
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = allCategories.map((category, index) => `
    <div class="category-item" draggable="true" data-id="${category.id}" data-index="${index}">
      <div style="display: flex; align-items: center; gap: var(--spacing-lg);">
        <button class="drag-handle" style="border: none; background: none; cursor: grab; padding: var(--spacing-md);">
          <i data-lucide="grip-vertical" style="width: 20px; height: 20px;"></i>
        </button>
        <div class="category-info">
          <div class="category-name">${escapeHtml(category.name)}</div>
          <div class="category-slug">/${category.slug}</div>
          <div class="category-meta">
            <span>${category.product_count?.[0]?.count || 0} product(s)</span>
            <span>${category.is_active ? '✓ Active' : '✗ Inactive'}</span>
          </div>
        </div>
      </div>
      <div class="category-actions">
        <button class="btn btn-sm btn-secondary" onclick="openEditModal('${category.id}')" title="Edit">
          <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
        </button>
        <button class="btn btn-sm btn-secondary" onclick="openDeleteModal('${category.id}')" title="Delete">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    </div>
  `).join('');

  setupDragAndDrop();
  lucide.createIcons();
}

function setupDragAndDrop() {
  const items = document.querySelectorAll('.category-item');

  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
      draggedItem = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const container = document.getElementById('categoriesContainer');
      const allItems = [...container.querySelectorAll('.category-item')];
      const draggedIndex = allItems.indexOf(draggedItem);
      const targetIndex = allItems.indexOf(item);

      if (draggedIndex < targetIndex) {
        item.parentNode.insertBefore(draggedItem, item.nextSibling);
      } else {
        item.parentNode.insertBefore(draggedItem, item);
      }
    });
  });
}

function openCreateModal() {
  currentEditingId = null;
  document.getElementById('modalTitle').textContent = 'Create Category';
  document.getElementById('submitBtn').textContent = 'Create Category';
  document.getElementById('categoryForm').reset();
  clearErrors();
  document.getElementById('categoryModal').classList.add('active');
}

function openEditModal(id) {
  currentEditingId = id;
  const category = allCategories.find(c => c.id === id);

  if (!category) {
    showError('Category not found');
    return;
  }

  document.getElementById('modalTitle').textContent = 'Edit Category';
  document.getElementById('submitBtn').textContent = 'Save Changes';
  document.getElementById('categoryName').value = category.name;
  document.getElementById('categorySlug').value = category.slug || '';
  document.getElementById('categoryDescription').value = category.description || '';
  clearErrors();
  document.getElementById('categoryModal').classList.add('active');
}

function closeModal() {
  document.getElementById('categoryModal').classList.remove('active');
  currentEditingId = null;
}

function openDeleteModal(id) {
  currentDeleteId = id;
  const category = allCategories.find(c => c.id === id);

  if (!category) {
    showError('Category not found');
    return;
  }

  const productCount = category.product_count?.[0]?.count || 0;
  const warning = document.getElementById('deleteWarning');

  if (productCount > 0) {
    warning.textContent = `⚠️ This category has ${productCount} product(s) assigned. You must choose what to do with them.`;
    document.getElementById('reassignCheckbox').checked = false;
    document.getElementById('reassignCheckbox').style.display = 'block';
    document.getElementById('reassignTarget').parentElement.style.display = 'block';
    populateReassignDropdown(id);
  } else {
    warning.textContent = '';
    document.getElementById('reassignCheckbox').style.display = 'none';
    document.getElementById('reassignTarget').parentElement.style.display = 'none';
  }

  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
  currentDeleteId = null;
  document.getElementById('reassignCheckbox').checked = false;
  document.getElementById('reassignTarget').value = '';
}

function confirmDelete() {
  if (currentDeleteId) {
    deleteCategory(currentDeleteId);
  }
}

function toggleReassignField() {
  const checkbox = document.getElementById('reassignCheckbox');
  const select = document.getElementById('reassignTarget');
  select.style.display = checkbox.checked ? 'block' : 'none';
}

function populateReassignDropdown(excludeId) {
  const select = document.getElementById('reassignTarget');
  select.innerHTML = '<option value="">Select a category</option>';

  allCategories
    .filter(c => c.id !== excludeId && c.is_active)
    .forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      select.appendChild(option);
    });
}

function refreshCategories() {
  loadCategories();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function showLoadingState(loading) {
  const btn = document.getElementById('submitBtn');
  if (btn) {
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.6' : '1';
  }
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
  });
  document.querySelectorAll('.form-input').forEach(el => {
    el.classList.remove('error');
  });
}

function showError(message, fieldId = null) {
  if (fieldId) {
    const errorEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = message;
      const input = document.getElementById(fieldId.replace('Error', ''));
      if (input) input.classList.add('error');
    }
  } else {
    if (window.notifications) {
      notifications.error(message);
    } else {
      alert(message);
    }
  }
}

function showSuccess(message) {
  if (window.notifications) {
    notifications.success(message);
  } else {
    alert(message);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleSidebar() {
  document.querySelector('.admin-sidebar').classList.toggle('collapsed');
}
