/**
 * FJL Admin Panel - Core Utilities
 * Handles authentication, data management, and API integration
 * Ready for backend migration
 */

class AdminDataService {
    constructor() {
        // Initialize admin authentication data (required for login to work)
        this.initializeAdminAuth();
    }

    // Initialize only admin authentication - NOT demo products
    initializeAdminAuth() {
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
        // Initialize empty products/orders/customers if they don't exist
        if (!localStorage.getItem('fjl_products')) {
            localStorage.setItem('fjl_products', JSON.stringify([]));
        }
        if (!localStorage.getItem('fjl_orders')) {
            localStorage.setItem('fjl_orders', JSON.stringify([]));
        }
        if (!localStorage.getItem('fjl_customers')) {
            localStorage.setItem('fjl_customers', JSON.stringify([]));
        }
        if (!localStorage.getItem('fjl_categories')) {
            localStorage.setItem('fjl_categories', JSON.stringify([]));
        }
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
    async loginAdmin(email, password) {
        try {
            const response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, message: error.error || 'Invalid credentials' };
            }

            const data = await response.json();
            const token = data.data.token;
            const admin = data.data.admin;

            // Store token in localStorage
            localStorage.setItem('fjl_admin_token', token);
            localStorage.setItem('fjl_admin', JSON.stringify({
                email: admin.email,
                full_name: admin.full_name,
                role: admin.role,
                id: admin.id
            }));

            // Also set in sessionStorage for backward compatibility
            sessionStorage.setItem('fjl_admin_authenticated', JSON.stringify({
                email: admin.email,
                full_name: admin.full_name,
                loginTime: new Date().toISOString()
            }));

            return { success: true, admin: admin };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed' };
        }
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
    async getProducts(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.inStock !== undefined) params.append('inStock', filters.inStock);
            if (filters.search) params.append('search', filters.search);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await fetch(`http://localhost:5001/api/products?${params}`);
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();

            // Transform API response to form-friendly format
            const products = (data.data || []).map(apiProduct => ({
                ...apiProduct,
                // Map API field names to form field names
                quantity: apiProduct.total_stock,
                inStock: apiProduct.is_active,
                isFeatured: apiProduct.is_featured,
                sleeve: apiProduct.sleeve_type || '', // Use actual sleeve_type value for dropdown
                sizes: apiProduct.available_sizes || [],
                colors: apiProduct.available_colors || [],
                image: apiProduct.image_url
            }));

            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    async getProductById(id) {
        try {
            const response = await fetch(`http://localhost:5001/api/products/${id}`);
            if (!response.ok) throw new Error('Failed to fetch product');
            const data = await response.json();
            const apiProduct = data.data;

            // Convert variants array to variant_stock object for form population
            const variant_stock = {};
            if (apiProduct.variants && Array.isArray(apiProduct.variants)) {
                apiProduct.variants.forEach(variant => {
                    const key = `${variant.color}-${variant.size}`;
                    variant_stock[key] = variant.stock_quantity;
                });
            }

            // Transform API response to form-friendly format
            const transformedProduct = {
                ...apiProduct,
                // Map API field names to form field names
                quantity: apiProduct.total_stock,
                inStock: apiProduct.is_active,
                isFeatured: apiProduct.is_featured,
                sleeve: apiProduct.sleeve_type || '', // Use actual sleeve_type value for dropdown
                sizes: apiProduct.available_sizes || [],
                colors: apiProduct.available_colors || [],
                image: apiProduct.image_url,
                // Keep original API fields for reference if needed
                total_stock: apiProduct.total_stock,
                is_active: apiProduct.is_active,
                is_featured: apiProduct.is_featured,
                sleeve_type: apiProduct.sleeve_type,
                available_sizes: apiProduct.available_sizes,
                available_colors: apiProduct.available_colors,
                image_url: apiProduct.image_url,
                // Add reconstructed variant_stock for form population
                variant_stock: variant_stock
            };

            return transformedProduct;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    }

    async createProduct(product) {
        try {
            // Map frontend product format to backend API format
            const apiProduct = {
                name: product.name,
                sku: product.sku,
                price: product.price,
                sleeve_type: product.sleeve_type || product.sleeve, // Map to sleeve_type
                total_stock: product.total_stock || product.quantity || 0,
                is_active: product.is_active !== undefined ? product.is_active : (product.inStock !== false)
            };

            // Only include fields with actual values
            if (product.description && product.description.trim()) {
                apiProduct.description = product.description.trim();
            }

            // Handle both old field names (colors/sizes) and new (available_colors/available_sizes)
            const colors = product.available_colors || product.colors || [];
            const sizes = product.available_sizes || product.sizes || [];

            if (colors && colors.length > 0) {
                apiProduct.available_colors = colors;
            }
            if (sizes && sizes.length > 0) {
                apiProduct.available_sizes = sizes;
            }

            // Stock distribution fields (new)
            if (product.distribution_mode) {
                apiProduct.distribution_mode = product.distribution_mode;
            }
            if (product.variant_stock && Object.keys(product.variant_stock).length > 0) {
                apiProduct.variant_stock = product.variant_stock;
            }

            // Optional fields
            if (product.original_price !== undefined) {
                apiProduct.original_price = product.original_price;
            } else if (product.originalPrice) {
                apiProduct.original_price = product.originalPrice;
            }
            if (product.category_id) {
                apiProduct.category_id = product.category_id;
            }
            if (product.image_url) {
                apiProduct.image_url = product.image_url;
            } else if (product.image) {
                apiProduct.image_url = product.image;
            }
            if (product.images && product.images.length > 0) {
                apiProduct.images = product.images;
            }

            const response = await fetch('http://localhost:5001/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('fjl_admin_token') || ''}`
                },
                body: JSON.stringify(apiProduct)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);

                // Extract detailed error message
                let errorMessage = errorData.error || errorData.message || 'Failed to create product';
                if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
                    const details = errorData.details.map(d => d.message || d).join(', ');
                    errorMessage = `${errorMessage}: ${details}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            const createdProduct = data.data;

            // Create product variants if sizeInventory is provided
            if (product.sizeInventory && Object.keys(product.sizeInventory).length > 0 && createdProduct.id) {
                console.log('📦 Creating variants for sizes:', product.sizeInventory);
                try {
                    let variantsCreated = 0;
                    for (const [size, quantity] of Object.entries(product.sizeInventory)) {
                        if (quantity > 0) {
                            // Create a variant for EACH color
                            const colorsToUse = product.colors && product.colors.length > 0 ? product.colors : [null];

                            for (const color of colorsToUse) {
                                const variantData = {
                                    size: size,
                                    stock_quantity: parseInt(quantity)
                                };

                                // Add color if available
                                if (color) {
                                    variantData.color = color;
                                }

                                console.log(`Creating variant: ${size} with ${quantity} units and color ${color || 'N/A'}`, variantData);

                                const variantResponse = await fetch(`http://localhost:5001/api/products/${createdProduct.id}/variants`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('fjl_admin_token') || ''}`
                                    },
                                    body: JSON.stringify(variantData)
                                });

                                if (!variantResponse.ok) {
                                    const errorData = await variantResponse.json();
                                    console.error(`❌ Failed to create variant for size ${size} color ${color || 'N/A'}:`, variantResponse.status, errorData);
                                } else {
                                    variantsCreated++;
                                    console.log(`✅ Created variant for size ${size} color ${color || 'N/A'}`);
                                }
                            }
                        }
                    }
                    console.log(`✅ Product variants created: ${variantsCreated} variants`);
                } catch (variantError) {
                    console.error('❌ Error creating product variants:', variantError);
                    // Don't fail the whole operation if variants fail
                }
            } else {
                console.warn('⚠️  No variants to create - sizeInventory is empty or product ID missing', {
                    hasSizeInventory: !!product.sizeInventory,
                    sizeInventoryKeys: product.sizeInventory ? Object.keys(product.sizeInventory) : [],
                    productId: createdProduct?.id
                });
            }

            return createdProduct;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    async updateProduct(id, updates) {
        try {
            // Map frontend product format to backend API format
            const apiUpdates = {};
            if (updates.name) apiUpdates.name = updates.name;
            if (updates.sku) apiUpdates.sku = updates.sku;
            if (updates.price) apiUpdates.price = updates.price;

            // Handle both old and new field names for prices
            if (updates.original_price !== undefined) {
                apiUpdates.original_price = updates.original_price;
            } else if (updates.originalPrice !== undefined) {
                apiUpdates.original_price = updates.originalPrice;
            }

            if (updates.description !== undefined) apiUpdates.description = updates.description;
            if (updates.category_id !== undefined) apiUpdates.category_id = updates.category_id;

            // Handle sleeve type
            if (updates.sleeve_type) apiUpdates.sleeve_type = updates.sleeve_type;
            else if (updates.sleeve) apiUpdates.sleeve_type = updates.sleeve;

            // Handle colors and sizes (both old and new field names)
            const colors = updates.available_colors || updates.colors;
            const sizes = updates.available_sizes || updates.sizes;
            if (colors) apiUpdates.available_colors = colors;
            if (sizes) apiUpdates.available_sizes = sizes;

            if (updates.image_url) apiUpdates.image_url = updates.image_url;
            else if (updates.image) apiUpdates.image_url = updates.image;
            if (updates.images) apiUpdates.images = updates.images;

            // Handle stock
            if (updates.total_stock !== undefined) {
                apiUpdates.total_stock = updates.total_stock;
            } else if (updates.quantity !== undefined) {
                apiUpdates.total_stock = updates.quantity;
            }

            // Handle active status
            if (updates.is_active !== undefined) {
                apiUpdates.is_active = updates.is_active;
            } else if (updates.inStock !== undefined) {
                apiUpdates.is_active = updates.inStock;
            }

            // Stock distribution fields
            if (updates.distribution_mode) apiUpdates.distribution_mode = updates.distribution_mode;
            if (updates.variant_stock) apiUpdates.variant_stock = updates.variant_stock;

            // Add support for is_featured
            if (updates.is_featured !== undefined) apiUpdates.is_featured = updates.is_featured;

            const response = await fetch(`http://localhost:5001/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('fjl_admin_token') || ''}`
                },
                body: JSON.stringify(apiUpdates)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);
                throw new Error(errorData.error || errorData.message || 'Failed to update product');
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const response = await fetch(`http://localhost:5001/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('fjl_admin_token') || ''}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete product');
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    async uploadProductImage(productId, file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`http://localhost:5001/api/products/${productId}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('fjl_admin_token') || ''}`
                },
                body: formData
            });
            if (!response.ok) throw new Error('Failed to upload image');
            const data = await response.json();
            return data.data.url;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    toggleFeatured(id) {
        const products = JSON.parse(localStorage.getItem('fjl_products'));
        const product = products.find(p => p.id === id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            product.updatedAt = new Date().toISOString();
            localStorage.setItem('fjl_products', JSON.stringify(products));
            // Dispatch storage event to notify other tabs/pages
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'fjl_products',
                newValue: JSON.stringify(products),
                oldValue: JSON.stringify(products),
                storageArea: localStorage
            }));
            return product;
        }
        return null;
    }

    // Inventory Management Methods
    checkInventory(productId, size, quantity = 1, color = null) {
        // First try to get product from localStorage (faster and more reliable)
        let product = null;
        const storedProducts = localStorage.getItem('fjl_products');
        if (storedProducts) {
            try {
                const allProducts = JSON.parse(storedProducts);
                product = allProducts.find(p => p.id === productId);
            } catch (e) {
                console.warn('Error parsing stored products:', e);
            }
        }

        // Fallback: try to get from API (but don't fail if it doesn't work)
        if (!product) {
            console.log('Product not found in localStorage for', productId);
            return { available: false, message: 'Product not found' };
        }

        // Get sizes - with fallback to extract from variants
        let sizes = product.sizes || [];
        if (sizes.length === 0 && product.variants && Array.isArray(product.variants)) {
            const sizesSet = new Set();
            product.variants.forEach(v => {
                if (v.size) sizesSet.add(v.size);
            });
            sizes = Array.from(sizesSet);
        }

        // Check if size exists
        if (!sizes || !sizes.includes(size)) {
            return { available: false, message: 'Invalid size for this product' };
        }

        // Get size inventory - with fallback to build from variants
        let sizeInventory = product.sizeInventory || {};
        if (Object.keys(sizeInventory).length === 0 && product.variants && Array.isArray(product.variants)) {
            sizeInventory = {};
            product.variants.forEach(variant => {
                if (variant.size) {
                    if (!sizeInventory[variant.size]) {
                        sizeInventory[variant.size] = 0;
                    }
                    sizeInventory[variant.size] += (variant.stock_quantity || 0);
                }
            });
        }

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

    deductInventory(productId, size, quantity = 1, color = null) {
        const productsStr = localStorage.getItem('fjl_products');
        if (!productsStr) {
            console.warn('No products in localStorage');
            return false;
        }

        try {
            const products = JSON.parse(productsStr);
            const index = products.findIndex(p => p.id === productId);

            if (index === -1) {
                console.warn('Product not found:', productId);
                return false;
            }

            const product = products[index];
            if (!product.sizeInventory) product.sizeInventory = {};

            const currentStock = product.sizeInventory[size] || 0;
            if (currentStock < quantity) {
                console.warn(`Insufficient stock: ${currentStock} available, ${quantity} requested`);
                return false;
            }

            product.sizeInventory[size] = currentStock - quantity;
            product.updatedAt = new Date().toISOString();

            localStorage.setItem('fjl_products', JSON.stringify(products));
            console.log(`✅ Deducted ${quantity} from ${size}${color ? ' (' + color + ')' : ''} (${product.sizeInventory[size]} remaining)`);
            return true;
        } catch (error) {
            console.error('Error deducting inventory:', error);
            return false;
        }
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
    async getOrders(filters = {}) {
        try {
            const token = localStorage.getItem('fjl_admin_token');
            if (!token) {
                console.error('No authentication token found');
                return [];
            }

            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.payment_status) params.append('payment_status', filters.payment_status);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await fetch(`http://localhost:5001/api/orders?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch orders:', response.statusText);
                return [];
            }

            const result = await response.json();
            let orders = result.data || [];

            // Transform backend response to frontend format
            orders = orders.map(order => ({
                id: order.id,
                orderId: order.order_number,
                customerName: `${order.users?.first_name || order.shipping_first_name || ''} ${order.users?.last_name || order.shipping_last_name || ''}`.trim(),
                customerEmail: order.users?.email || order.shipping_email || '',
                total: order.total_amount || 0,
                subtotal: order.subtotal || 0,
                tax: order.tax || 0,
                shippingCost: order.shipping_cost || 0,
                status: order.order_status || 'pending',
                paymentStatus: order.payment_status || 'pending',
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                items: order.order_items ? order.order_items.map(item => ({
                    id: item.id,
                    name: item.product_name,
                    productId: item.product_id,
                    sku: item.product_sku,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: parseFloat(item.unit_price) || 0,
                    total: parseFloat(item.total_price) || 0
                })) : [],
                shippingAddress: {
                    firstName: order.shipping_first_name,
                    lastName: order.shipping_last_name,
                    email: order.shipping_email,
                    phone: order.shipping_phone,
                    address: order.shipping_address,
                    city: order.shipping_city,
                    state: order.shipping_state,
                    postalCode: order.shipping_postal_code,
                    country: order.shipping_country
                }
            }));

            // Apply client-side filters (for search)
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
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    }

    async getOrderById(id) {
        try {
            const token = localStorage.getItem('fjl_admin_token');
            if (!token) {
                console.error('No authentication token found');
                return null;
            }

            const response = await fetch(`http://localhost:5001/api/orders/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch order:', response.statusText);
                return null;
            }

            const result = await response.json();
            const order = result.data;

            // Transform backend response to frontend format
            return {
                id: order.id,
                orderId: order.order_number,
                customerName: `${order.users?.first_name || order.shipping_first_name || ''} ${order.users?.last_name || order.shipping_last_name || ''}`.trim(),
                customerEmail: order.users?.email || order.shipping_email || '',
                total: order.total_amount || 0,
                subtotal: order.subtotal || 0,
                tax: order.tax || 0,
                shippingCost: order.shipping_cost || 0,
                status: order.order_status || 'pending',
                paymentStatus: order.payment_status || 'pending',
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                items: order.order_items ? order.order_items.map(item => ({
                    id: item.id,
                    name: item.product_name,
                    productId: item.product_id,
                    sku: item.product_sku,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: parseFloat(item.unit_price) || 0,
                    total: parseFloat(item.total_price) || 0
                })) : [],
                shippingAddress: {
                    firstName: order.shipping_first_name,
                    lastName: order.shipping_last_name,
                    email: order.shipping_email,
                    phone: order.shipping_phone,
                    address: order.shipping_address,
                    city: order.shipping_city,
                    state: order.shipping_state,
                    postalCode: order.shipping_postal_code,
                    country: order.shipping_country
                }
            };
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            const token = localStorage.getItem('fjl_admin_token');
            if (!token) {
                console.error('No authentication token found');
                return null;
            }

            // Convert status to lowercase for backend compatibility
            const statusValue = newStatus.toLowerCase();

            const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: statusValue })
            });

            if (!response.ok) {
                console.error('Failed to update order status:', response.statusText);
                return null;
            }

            const result = await response.json();
            const order = result.data;

            // Transform backend response to frontend format (same as getOrderById)
            return {
                id: order.id,
                orderId: order.order_number,
                customerName: `${order.users?.first_name || order.shipping_first_name || ''} ${order.users?.last_name || order.shipping_last_name || ''}`.trim(),
                customerEmail: order.users?.email || order.shipping_email || '',
                total: order.total_amount || 0,
                subtotal: order.subtotal || 0,
                tax: order.tax || 0,
                shippingCost: order.shipping_cost || 0,
                status: order.order_status || 'pending',
                paymentStatus: order.payment_status || 'pending',
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                items: order.order_items ? order.order_items.map(item => ({
                    id: item.id,
                    name: item.product_name,
                    productId: item.product_id,
                    sku: item.product_sku,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: parseFloat(item.unit_price) || 0,
                    total: parseFloat(item.total_price) || 0
                })) : [],
                shippingAddress: {
                    firstName: order.shipping_first_name,
                    lastName: order.shipping_last_name,
                    email: order.shipping_email,
                    phone: order.shipping_phone,
                    address: order.shipping_address,
                    city: order.shipping_city,
                    state: order.shipping_state,
                    postalCode: order.shipping_postal_code,
                    country: order.shipping_country
                }
            };
        } catch (error) {
            console.error('Error updating order status:', error);
            return null;
        }
    }

    async updatePaymentStatus(orderId, paymentStatus) {
        try {
            const token = localStorage.getItem('fjl_admin_token');
            if (!token) {
                console.error('No authentication token found');
                return null;
            }

            // Convert status to lowercase for backend compatibility
            const statusValue = paymentStatus.toLowerCase();

            const response = await fetch(`http://localhost:5001/api/orders/${orderId}/payment-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ payment_status: statusValue })
            });

            if (!response.ok) {
                console.error('Failed to update payment status:', response.statusText);
                return null;
            }

            const result = await response.json();
            const order = result.data;

            // Transform backend response to frontend format (same as getOrderById)
            return {
                id: order.id,
                orderId: order.order_number,
                customerName: `${order.users?.first_name || order.shipping_first_name || ''} ${order.users?.last_name || order.shipping_last_name || ''}`.trim(),
                customerEmail: order.users?.email || order.shipping_email || '',
                total: order.total_amount || 0,
                subtotal: order.subtotal || 0,
                tax: order.tax || 0,
                shippingCost: order.shipping_cost || 0,
                status: order.order_status || 'pending',
                paymentStatus: order.payment_status || 'pending',
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                items: order.order_items ? order.order_items.map(item => ({
                    id: item.id,
                    name: item.product_name,
                    productId: item.product_id,
                    sku: item.product_sku,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: parseFloat(item.unit_price) || 0,
                    total: parseFloat(item.total_price) || 0
                })) : [],
                shippingAddress: {
                    firstName: order.shipping_first_name,
                    lastName: order.shipping_last_name,
                    email: order.shipping_email,
                    phone: order.shipping_phone,
                    address: order.shipping_address,
                    city: order.shipping_city,
                    state: order.shipping_state,
                    postalCode: order.shipping_postal_code,
                    country: order.shipping_country
                }
            };
        } catch (error) {
            console.error('Error updating payment status:', error);
            return null;
        }
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
                    // Safety check: ensure order has items array
                    if (!o.items || !Array.isArray(o.items)) {
                        return count;
                    }
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
