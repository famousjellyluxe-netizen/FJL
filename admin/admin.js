/**
 * FJL Admin Panel - Core Utilities
 * Handles authentication, data management, and API integration
 * Ready for backend migration
 */

class AdminDataService {
    constructor() {
        this.initializeData();
    }

    // Initialize default data structures in localStorage
    initializeData() {
        if (!localStorage.getItem('fjl_admin')) {
            localStorage.setItem('fjl_admin', JSON.stringify({
                email: 'admin@fjl.com',
                password: 'admin123', // In production: use bcrypt + backend
                businessName: 'Famous Jelly Luxe',
                storeName: 'FJL Premium Store',
                storeEmail: 'store@fjl.com',
                storePhone: '+234 800 123 4567',
                storeAddress: '123 Luxury Street, Lagos, Nigeria',
                bankName: 'First Bank Nigeria',
                accountNumber: '2058123456',
                accountHolder: 'Famous Jelly Luxe Ltd',
                taxRate: 7.5,
                shippingCost: 0,
                createdAt: new Date().toISOString()
            }));
        }

        if (!localStorage.getItem('fjl_products')) {
            localStorage.setItem('fjl_products', JSON.stringify([
                {
                    id: 'ftg-checkered-jersey',
                    name: 'FTG Checkered Jersey',
                    sleeve: 'sleeveless',
                    price: 75300,
                    originalPrice: 85000,
                    sku: 'FCJ-001',
                    image: 'placeholder',
                    description: 'Premium quality checkered jersey with custom FJL branding',
                    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                    colors: ['Black', 'Navy', 'Gold'],
                    quantity: 50,
                    sizeInventory: { 'XS': 8, 'S': 12, 'M': 15, 'L': 10, 'XL': 3, 'XXL': 2 },
                    inStock: true,
                    sizeChart: {
                        'XS': { chest: '32"(81cm)', length: '24"(61cm)', sleeve: '6"(15cm)', shoulder: '13"(33cm)' },
                        'S': { chest: '34"(86cm)', length: '25"(64cm)', sleeve: '6.5"(17cm)', shoulder: '14"(36cm)' },
                        'M': { chest: '36"(91cm)', length: '26"(66cm)', sleeve: '7"(18cm)', shoulder: '15"(38cm)' },
                        'L': { chest: '38"(97cm)', length: '27"(69cm)', sleeve: '7.5"(19cm)', shoulder: '16"(41cm)' },
                        'XL': { chest: '40"(102cm)', length: '28"(71cm)', sleeve: '8"(20cm)', shoulder: '17"(43cm)' },
                        'XXL': { chest: '42"(107cm)', length: '29"(74cm)', sleeve: '8.5"(22cm)', shoulder: '18"(46cm)' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'ftg-rugby-polo',
                    name: 'FTG Rugby Polo',
                    sleeve: 'sleeve',
                    price: 67000,
                    originalPrice: 75000,
                    sku: 'FRP-001',
                    image: 'placeholder',
                    description: 'Classic rugby polo shirt with embroidered FJL logo',
                    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                    colors: ['Black', 'White', 'Navy'],
                    quantity: 45,
                    sizeInventory: { 'S': 12, 'M': 15, 'L': 10, 'XL': 5, 'XXL': 3 },
                    inStock: true,
                    sizeChart: {
                        'S': { chest: '34"(86cm)', length: '26"(66cm)', sleeve: '9"(23cm)', shoulder: '14"(36cm)' },
                        'M': { chest: '36"(91cm)', length: '27"(69cm)', sleeve: '9.5"(24cm)', shoulder: '15"(38cm)' },
                        'L': { chest: '38"(97cm)', length: '28"(71cm)', sleeve: '10"(25cm)', shoulder: '16"(41cm)' },
                        'XL': { chest: '40"(102cm)', length: '29"(74cm)', sleeve: '10.5"(27cm)', shoulder: '17"(43cm)' },
                        'XXL': { chest: '42"(107cm)', length: '30"(76cm)', sleeve: '11"(28cm)', shoulder: '18"(46cm)' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'ftg-tracksuit',
                    name: 'FTG Tracksuit',
                    sleeve: 'sleeve',
                    price: 75000,
                    originalPrice: 90000,
                    sku: 'FTS-001',
                    image: 'placeholder',
                    description: 'Luxurious tracksuit set perfect for streetwear enthusiasts',
                    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                    colors: ['Black', 'Gold', 'Navy'],
                    quantity: 30,
                    sizeInventory: { 'XS': 0, 'S': 5, 'M': 8, 'L': 10, 'XL': 5, 'XXL': 2 },
                    inStock: true,
                    sizeChart: {
                        'XS': { chest: '32"(81cm)', length: '24"(61cm)', inseam: '28"(71cm)', shoulder: '13"(33cm)' },
                        'S': { chest: '34"(86cm)', length: '25"(64cm)', inseam: '29"(74cm)', shoulder: '14"(36cm)' },
                        'M': { chest: '36"(91cm)', length: '26"(66cm)', inseam: '30"(76cm)', shoulder: '15"(38cm)' },
                        'L': { chest: '38"(97cm)', length: '27"(69cm)', inseam: '31"(79cm)', shoulder: '16"(41cm)' },
                        'XL': { chest: '40"(102cm)', length: '28"(71cm)', inseam: '32"(81cm)', shoulder: '17"(43cm)' },
                        'XXL': { chest: '42"(107cm)', length: '29"(74cm)', inseam: '33"(84cm)', shoulder: '18"(46cm)' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'soccer-baby-tee',
                    name: 'Soccer Baby Tee',
                    sleeve: 'sleeveless',
                    price: 7700,
                    originalPrice: 10000,
                    sku: 'SBT-001',
                    image: 'placeholder',
                    description: 'Cute and comfy baby tee with soccer print',
                    sizes: ['XS', 'S', 'M'],
                    colors: ['Black', 'White', 'Red'],
                    quantity: 100,
                    sizeInventory: { 'XS': 35, 'S': 40, 'M': 25 },
                    inStock: true,
                    sizeChart: {
                        'XS': { chest: '28"(71cm)', length: '20"(51cm)', shoulder: '11"(28cm)' },
                        'S': { chest: '30"(76cm)', length: '21"(53cm)', shoulder: '12"(30cm)' },
                        'M': { chest: '32"(81cm)', length: '22"(56cm)', shoulder: '13"(33cm)' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'soccer-baby-crop-top',
                    name: 'Soccer Baby Crop Top',
                    sleeve: 'sleeveless',
                    price: 6500,
                    originalPrice: 8500,
                    sku: 'SBCT-001',
                    image: 'placeholder',
                    description: 'Trendy crop top with soccer-inspired design',
                    sizes: ['XS', 'S', 'M', 'L'],
                    colors: ['Black', 'White', 'Gold'],
                    quantity: 75,
                    sizeInventory: { 'XS': 0, 'S': 25, 'M': 30, 'L': 20 },
                    inStock: true,
                    sizeChart: {
                        'XS': { chest: '28"(71cm)', length: '14"(36cm)', shoulder: '11"(28cm)' },
                        'S': { chest: '30"(76cm)', length: '15"(38cm)', shoulder: '12"(30cm)' },
                        'M': { chest: '32"(81cm)', length: '16"(41cm)', shoulder: '13"(33cm)' },
                        'L': { chest: '34"(86cm)', length: '17"(43cm)', shoulder: '14"(36cm)' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'ftg-logo-tshirt',
                    name: 'FTG Logo T-Shirt',
                    sleeve: 'sleeveless',
                    price: 4100,
                    originalPrice: 5500,
                    sku: 'FLT-001',
                    image: 'placeholder',
                    description: 'Classic t-shirt with minimalist FJL logo',
                    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                    colors: ['Black', 'White', 'Navy'],
                    quantity: 150,
                    sizeInventory: { 'S': 40, 'M': 50, 'L': 35, 'XL': 15, 'XXL': 10 },
                    inStock: true,
                    sizeChart: {
                        'S': { chest: '34"(86cm)', length: '25"(64cm)', shoulder: '14"(36cm)' },
                        'M': { chest: '36"(91cm)', length: '26"(66cm)', shoulder: '15"(38cm)' },
                        'L': { chest: '38"(97cm)', length: '27"(69cm)', shoulder: '16"(41cm)' },
                        'XL': { chest: '40"(102cm)', length: '28"(71cm)', shoulder: '17"(43cm)' },
                        'XXL': { chest: '42"(107cm)', length: '29"(74cm)', shoulder: '18"(46cm)' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'urban-varsity-jacket',
                    name: 'Urban Varsity Jacket',
                    sleeve: 'sleeve',
                    price: 70000,
                    originalPrice: 85000,
                    sku: 'UVJ-001',
                    image: 'placeholder',
                    description: 'Premium varsity jacket for the modern urbanite',
                    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                    colors: ['Black', 'Navy', 'Gold'],
                    quantity: 25,
                    sizeInventory: { 'S': 5, 'M': 6, 'L': 7, 'XL': 4, 'XXL': 3 },
                    inStock: true,
                    sizeChart: {
                        'S': { chest: '36"(91cm)', length: '26"(66cm)', sleeve: '10"(25cm)', shoulder: '15"(38cm)' },
                        'M': { chest: '38"(97cm)', length: '27"(69cm)', sleeve: '10.5"(27cm)', shoulder: '16"(41cm)' },
                        'L': { chest: '40"(102cm)', length: '28"(71cm)', sleeve: '11"(28cm)', shoulder: '17"(43cm)' },
                        'XL': { chest: '42"(107cm)', length: '29"(74cm)', sleeve: '11.5"(29cm)', shoulder: '18"(46cm)' },
                        'XXL': { chest: '44"(112cm)', length: '30"(76cm)', sleeve: '12"(30cm)', shoulder: '19"(48cm)' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]));
        }

        if (!localStorage.getItem('fjl_orders')) {
            localStorage.setItem('fjl_orders', JSON.stringify([]));
        }

        if (!localStorage.getItem('fjl_customers')) {
            localStorage.setItem('fjl_customers', JSON.stringify([]));
        }

        if (!localStorage.getItem('fjl_categories')) {
            localStorage.setItem('fjl_categories', JSON.stringify([
                { id: 'tops', name: 'Tops', slug: 'tops', description: 'Shirts, tees, and more' },
                { id: 'bottoms', name: 'Bottoms', slug: 'bottoms', description: 'Pants, shorts, and more' },
                { id: 'outerwear', name: 'Outerwear', slug: 'outerwear', description: 'Jackets and coats' },
                { id: 'sets', name: 'Sets', slug: 'sets', description: 'Complete outfit sets' },
                { id: 'accessories', name: 'Accessories', slug: 'accessories', description: 'Bags, belts, and more' }
            ]));
        }
    }

    // Authentication Methods
    loginAdmin(email, password) {
        const admin = JSON.parse(localStorage.getItem('fjl_admin'));
        if (admin.email === email && admin.password === password) {
            sessionStorage.setItem('fjl_admin_authenticated', JSON.stringify({
                email: admin.email,
                businessName: admin.businessName,
                loginTime: new Date().toISOString()
            }));
            return { success: true, admin: admin };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    logoutAdmin() {
        sessionStorage.removeItem('fjl_admin_authenticated');
    }

    isAdminAuthenticated() {
        return sessionStorage.getItem('fjl_admin_authenticated') !== null;
    }

    getAdminInfo() {
        const auth = sessionStorage.getItem('fjl_admin_authenticated');
        return auth ? JSON.parse(auth) : null;
    }

    // Product Methods
    getProducts(filters = {}) {
        let products = JSON.parse(localStorage.getItem('fjl_products'));

        if (filters.category) {
            products = products.filter(p => p.sleeve === filters.category);
        }
        if (filters.inStock !== undefined) {
            products = products.filter(p => p.inStock === filters.inStock);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(search) ||
                p.sku.toLowerCase().includes(search)
            );
        }

        return products;
    }

    getProductById(id) {
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        return products.find(p => p.id === id);
    }

    createProduct(product) {
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        const newProduct = {
            id: product.id || `product-${Date.now()}`,
            ...product,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        products.push(newProduct);
        localStorage.setItem('fjl_products', JSON.stringify(products));
        return newProduct;
    }

    updateProduct(id, updates) {
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('fjl_products', JSON.stringify(products));
            return products[index];
        }
        return null;
    }

    deleteProduct(id) {
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem('fjl_products', JSON.stringify(filtered));
        return true;
    }

    // Inventory Management Methods
    checkInventory(productId, size, quantity = 1) {
        const product = this.getProductById(productId);
        if (!product) return { available: false, message: 'Product not found' };

        // Check if size exists
        if (!product.sizes.includes(size)) {
            return { available: false, message: 'Invalid size for this product' };
        }

        // Get size inventory (with fallback for backward compatibility)
        const sizeInventory = product.sizeInventory || {};
        const availableQuantity = sizeInventory[size] || 0;

        if (availableQuantity <= 0) {
            return { available: false, message: `${size} size is out of stock`, stock: 0 };
        }

        if (availableQuantity < quantity) {
            return { available: false, message: `Only ${availableQuantity} ${size} items available`, stock: availableQuantity };
        }

        return { available: true, stock: availableQuantity };
    }

    getSizeInventory(productId, size) {
        const product = this.getProductById(productId);
        if (!product) return 0;

        const sizeInventory = product.sizeInventory || {};
        return sizeInventory[size] || 0;
    }

    deductInventory(productId, size, quantity = 1) {
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        const index = products.findIndex(p => p.id === productId);

        if (index === -1) return false;

        const product = products[index];
        if (!product.sizeInventory) product.sizeInventory = {};

        const currentStock = product.sizeInventory[size] || 0;
        if (currentStock < quantity) return false;

        product.sizeInventory[size] = currentStock - quantity;
        product.updatedAt = new Date().toISOString();

        localStorage.setItem('fjl_products', JSON.stringify(products));
        return true;
    }

    updateSizeInventory(productId, size, quantity) {
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        const index = products.findIndex(p => p.id === productId);

        if (index === -1) return false;

        const product = products[index];
        if (!product.sizeInventory) product.sizeInventory = {};

        product.sizeInventory[size] = Math.max(0, quantity);
        product.updatedAt = new Date().toISOString();

        localStorage.setItem('fjl_products', JSON.stringify(products));
        return true;
    }

    // Order Methods
    getOrders(filters = {}) {
        let orders = JSON.parse(localStorage.getItem('fjl_orders'));

        if (filters.status) {
            orders = orders.filter(o => o.status === filters.status);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            orders = orders.filter(o =>
                o.customerName.toLowerCase().includes(search) ||
                o.orderId.toLowerCase().includes(search)
            );
        }
        if (filters.dateFrom) {
            orders = orders.filter(o => new Date(o.createdAt) >= new Date(filters.dateFrom));
        }
        if (filters.dateTo) {
            orders = orders.filter(o => new Date(o.createdAt) <= new Date(filters.dateTo));
        }

        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getOrderById(id) {
        const orders = JSON.parse(localStorage.getItem('fjl_orders'));
        return orders.find(o => o.id === id || o.orderId === id);
    }

    updateOrderStatus(orderId, newStatus) {
        const orders = JSON.parse(localStorage.getItem('fjl_orders'));
        const order = orders.find(o => o.id === orderId || o.orderId === orderId);
        if (order) {
            order.status = newStatus;
            order.updatedAt = new Date().toISOString();
            localStorage.setItem('fjl_orders', JSON.stringify(orders));
            return order;
        }
        return null;
    }

    // Customer Methods
    getCustomers(filters = {}) {
        let customers = JSON.parse(localStorage.getItem('fjl_customers'));

        if (filters.search) {
            const search = filters.search.toLowerCase();
            customers = customers.filter(c =>
                c.name.toLowerCase().includes(search) ||
                c.email.toLowerCase().includes(search)
            );
        }

        return customers.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    }

    getCustomerById(id) {
        const customers = JSON.parse(localStorage.getItem('fjl_customers'));
        return customers.find(c => c.id === id);
    }

    // Settings Methods
    updateAdminSettings(updates) {
        const admin = JSON.parse(localStorage.getItem('fjl_admin'));
        const updated = { ...admin, ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem('fjl_admin', JSON.stringify(updated));
        return updated;
    }

    getAdminSettings() {
        return JSON.parse(localStorage.getItem('fjl_admin'));
    }

    // Analytics Methods
    getAnalytics() {
        const orders = JSON.parse(localStorage.getItem('fjl_orders'));
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        const customers = JSON.parse(localStorage.getItem('fjl_customers'));

        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        const totalProducts = products.length;

        const recentOrders = orders.slice(0, 5);
        const topProducts = products
            .map(p => ({
                ...p,
                sold: orders.reduce((count, o) => {
                    const item = o.items.find(i => i.id === p.id);
                    return count + (item ? item.quantity : 0);
                }, 0)
            }))
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5);

        const lowStockProducts = products.filter(p => p.quantity < 20);

        return {
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
            recentOrders,
            topProducts,
            lowStockProducts,
            ordersByStatus: this.getOrdersByStatus(orders),
            revenueByMonth: this.getRevenueByMonth(orders)
        };
    }

    getOrdersByStatus(orders = null) {
        if (!orders) {
            orders = JSON.parse(localStorage.getItem('fjl_orders'));
        }
        const statuses = {};
        orders.forEach(o => {
            statuses[o.status] = (statuses[o.status] || 0) + 1;
        });
        return statuses;
    }

    getRevenueByMonth(orders = null) {
        if (!orders) {
            orders = JSON.parse(localStorage.getItem('fjl_orders'));
        }
        const revenue = {};
        orders.forEach(o => {
            const month = new Date(o.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
            revenue[month] = (revenue[month] || 0) + (o.total || 0);
        });
        return revenue;
    }

    // Export Methods
    exportToCSV(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csv = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csv.push(values.join(','));
        });

        return csv.join('\n');
    }
}

// Global instance
const adminDataService = new AdminDataService();

// Data migration function to add sizeChart to existing products
function migrateSizeChartData() {
    const products = JSON.parse(localStorage.getItem('fjl_products') || '[]');
    const defaultSizeCharts = {
        'ftg-checkered-jersey': {
            'XS': { chest: '32"(81cm)', length: '24"(61cm)', sleeve: '6"(15cm)', shoulder: '13"(33cm)' },
            'S': { chest: '34"(86cm)', length: '25"(64cm)', sleeve: '6.5"(17cm)', shoulder: '14"(36cm)' },
            'M': { chest: '36"(91cm)', length: '26"(66cm)', sleeve: '7"(18cm)', shoulder: '15"(38cm)' },
            'L': { chest: '38"(97cm)', length: '27"(69cm)', sleeve: '7.5"(19cm)', shoulder: '16"(41cm)' },
            'XL': { chest: '40"(102cm)', length: '28"(71cm)', sleeve: '8"(20cm)', shoulder: '17"(43cm)' },
            'XXL': { chest: '42"(107cm)', length: '29"(74cm)', sleeve: '8.5"(22cm)', shoulder: '18"(46cm)' }
        },
        'ftg-rugby-polo': {
            'S': { chest: '34"(86cm)', length: '26"(66cm)', sleeve: '9"(23cm)', shoulder: '14"(36cm)' },
            'M': { chest: '36"(91cm)', length: '27"(69cm)', sleeve: '9.5"(24cm)', shoulder: '15"(38cm)' },
            'L': { chest: '38"(97cm)', length: '28"(71cm)', sleeve: '10"(25cm)', shoulder: '16"(41cm)' },
            'XL': { chest: '40"(102cm)', length: '29"(74cm)', sleeve: '10.5"(27cm)', shoulder: '17"(43cm)' },
            'XXL': { chest: '42"(107cm)', length: '30"(76cm)', sleeve: '11"(28cm)', shoulder: '18"(46cm)' }
        },
        'ftg-tracksuit': {
            'XS': { chest: '32"(81cm)', length: '24"(61cm)', inseam: '28"(71cm)', shoulder: '13"(33cm)' },
            'S': { chest: '34"(86cm)', length: '25"(64cm)', inseam: '29"(74cm)', shoulder: '14"(36cm)' },
            'M': { chest: '36"(91cm)', length: '26"(66cm)', inseam: '30"(76cm)', shoulder: '15"(38cm)' },
            'L': { chest: '38"(97cm)', length: '27"(69cm)', inseam: '31"(79cm)', shoulder: '16"(41cm)' },
            'XL': { chest: '40"(102cm)', length: '28"(71cm)', inseam: '32"(81cm)', shoulder: '17"(43cm)' },
            'XXL': { chest: '42"(107cm)', length: '29"(74cm)', inseam: '33"(84cm)', shoulder: '18"(46cm)' }
        },
        'soccer-baby-tee': {
            'XS': { chest: '28"(71cm)', length: '20"(51cm)', shoulder: '11"(28cm)' },
            'S': { chest: '30"(76cm)', length: '21"(53cm)', shoulder: '12"(30cm)' },
            'M': { chest: '32"(81cm)', length: '22"(56cm)', shoulder: '13"(33cm)' }
        },
        'soccer-baby-crop-top': {
            'XS': { chest: '28"(71cm)', length: '14"(36cm)', shoulder: '11"(28cm)' },
            'S': { chest: '30"(76cm)', length: '15"(38cm)', shoulder: '12"(30cm)' },
            'M': { chest: '32"(81cm)', length: '16"(41cm)', shoulder: '13"(33cm)' },
            'L': { chest: '34"(86cm)', length: '17"(43cm)', shoulder: '14"(36cm)' }
        },
        'ftg-logo-tshirt': {
            'S': { chest: '34"(86cm)', length: '25"(64cm)', shoulder: '14"(36cm)' },
            'M': { chest: '36"(91cm)', length: '26"(66cm)', shoulder: '15"(38cm)' },
            'L': { chest: '38"(97cm)', length: '27"(69cm)', shoulder: '16"(41cm)' },
            'XL': { chest: '40"(102cm)', length: '28"(71cm)', shoulder: '17"(43cm)' },
            'XXL': { chest: '42"(107cm)', length: '29"(74cm)', shoulder: '18"(46cm)' }
        },
        'urban-varsity-jacket': {
            'S': { chest: '36"(91cm)', length: '26"(66cm)', sleeve: '10"(25cm)', shoulder: '15"(38cm)' },
            'M': { chest: '38"(97cm)', length: '27"(69cm)', sleeve: '10.5"(27cm)', shoulder: '16"(41cm)' },
            'L': { chest: '40"(102cm)', length: '28"(71cm)', sleeve: '11"(28cm)', shoulder: '17"(43cm)' },
            'XL': { chest: '42"(107cm)', length: '29"(74cm)', sleeve: '11.5"(29cm)', shoulder: '18"(46cm)' },
            'XXL': { chest: '44"(112cm)', length: '30"(76cm)', sleeve: '12"(30cm)', shoulder: '19"(48cm)' }
        }
    };

    let updated = false;
    products.forEach(product => {
        if (!product.sizeChart && defaultSizeCharts[product.id]) {
            product.sizeChart = defaultSizeCharts[product.id];
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem('fjl_products', JSON.stringify(products));
    }
}

// Run migration on page load
migrateSizeChartData();

// Utility Functions
function formatCurrency(amount) {
    return '₦' + amount.toLocaleString('en-NG');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateOrderId() {
    return 'ORD-' + Date.now().toString(36).toUpperCase();
}

function checkAdminAuth() {
    if (!adminDataService.isAdminAuthenticated()) {
        window.location.href = '/admin/index.html';
        return false;
    }
    return true;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminDataService, adminDataService, formatCurrency, formatDate, formatTime, generateOrderId, checkAdminAuth };
}
