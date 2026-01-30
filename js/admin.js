// --- DATA MANAGEMENT & API CALLS ---
// Use local API when on localhost, else deployed backend base URL
const API_URL = (function () {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    return 'https://rhyl-backend.vercel.app/api';
})();

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
    }
}

// --- AUTH & INITIALIZATION ---
const loginOverlay = document.getElementById('login-overlay');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');

// Check if logged in via main login flow or stored session
if (localStorage.getItem('adminLoggedIn') === 'true' && localStorage.getItem('token')) {
    showAdminPanel();
} else {
    // If not logged in, ensure overlay is shown
    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (data.success) {
                const userData = data.data;
                if (userData.role === 'admin') {
                    localStorage.setItem('token', userData.token);
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('adminLoggedIn', 'true');
                    showAdminPanel();
                } else {
                    alert('Access denied: You are not an admin.');
                }
            } else {
                alert(data.message || 'Invalid credentials');
            }
        } catch (err) {
            console.error(err);
            alert('Login failed. Please try again.');
        }
    });
}

function showAdminPanel() {
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'flex';
    initDashboard();
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

window.toggleMobileSidebar = function () {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('mobile-show');
    if (overlay) overlay.classList.toggle('show');
};

// --- NAVIGATION ---
window.switchTab = function (tabId) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.style.display = 'block';

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('onclick').includes(`'${tabId}'`)) {
            item.classList.add('active');
        }
    });

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1) + ' Overview';

    if (tabId === 'dashboard') initDashboard();
    if (tabId === 'products') renderAdminProducts();
    if (tabId === 'categories') renderAdminCategories();
    if (tabId === 'orders') renderAdminOrders();
    if (tabId === 'inventory') renderAdminInventory();
    if (tabId === 'customers') renderAdminCustomers();
    if (tabId === 'discounts') renderAdminDiscounts();
    if (tabId === 'analytics') renderAdminAnalytics();

    // Close sidebar on mobile after selection
    const sidebar = document.getElementById('admin-sidebar');
    if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('mobile-show')) {
        toggleMobileSidebar();
    }
};

// --- CORE MODULES ---
async function initDashboard() {
    const stats = await fetchDashboardStats();
    if (stats) {
        updateStats(stats);
        renderRecentOrders(stats.recentOrders);
        renderLowStock(stats.lowStockProducts);
    }
    renderSalesChart();
}

function renderSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (window.dashboardSalesChart) {
        window.dashboardSalesChart.destroy();
    }

    const context = ctx.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(13, 148, 136, 0.2)');
    gradient.addColorStop(1, 'rgba(13, 148, 136, 0)');

    window.dashboardSalesChart = new Chart(context, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Monthly Sales',
                data: [650, 900, 750, 1200, 1100, 1450, 1300], // Mock Data
                borderColor: '#0d9488',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0d9488',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 14 },
                    callbacks: {
                        label: function (context) {
                            return '£' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        callback: function (value) {
                            return '£' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b'
                    }
                }
            }
        }
    });
}

function updateStats(stats) {
    document.getElementById('stat-products').innerText = stats.totalProducts;
    document.getElementById('stat-orders').innerText = stats.totalOrders;
    document.getElementById('stat-customers').innerText = stats.totalCustomers;
    document.getElementById('stat-sales').innerText = `£${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function renderRecentOrders(orders) {
    const list = document.getElementById('recent-orders-list');
    if (!orders || orders.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-center">No recent orders</td></tr>';
        return;
    }

    list.innerHTML = orders.map(o => `
        <tr>
            <td>#${o._id.substring(o._id.length - 6)}</td>
            <td>${o.user ? o.user.name : 'Guest'}</td>
            <td>£${o.totalAmount.toFixed(2)}</td>
            <td><span class="status-badge ${o.paymentStatus === 'paid' ? 'status-Confirmed' : 'status-Pending'}">${o.paymentStatus}</span></td>
        </tr>
    `).join('');
}

function renderLowStock(lowStockProducts) {
    const table = document.getElementById('low-stock-table');
    if (!lowStockProducts || lowStockProducts.length === 0) {
        table.innerHTML = '<tr><td colspan="3" style="text-align:center;">All products are well stocked.</td></tr>';
        return;
    }

    table.innerHTML = lowStockProducts.map(p => `
        <tr>
            <td><img src="${p.image || 'https://via.placeholder.com/50'}" class="table-img"></td>
            <td><strong>${p.name}</strong><br><small>${p.category ? p.category.name : 'Uncategorized'}</small></td>
            <td>${p.stock} Units</td>
        </tr>
    `).join('');
}

// --- PRODUCT MANAGEMENT ---
let productSearchQuery = '';
let productCategoryFilter = 'All';
let searchTimeout = null;

async function fetchProducts() {
    try {
        let url = `${API_URL}/products?limit=100`;
        if (productSearchQuery) {
            url += `&search=${encodeURIComponent(productSearchQuery)}`;
        }
        if (productCategoryFilter && productCategoryFilter !== 'All') {
            url += `&category=${productCategoryFilter}`;
        }

        const response = await fetch(url, { headers: getAuthHeaders() });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

window.filterAdminProducts = function (val) {
    productSearchQuery = val;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        renderAdminProducts();
    }, 400);
}

window.filterAdminCategory = function (val) {
    productCategoryFilter = val;
    renderAdminProducts();
}

async function fetchCategoriesForFilter() {
    try {
        if (typeof fetchCategories !== 'function') return;
        const categories = await fetchCategories();
        const select = document.getElementById('product-filter-category');
        if (!select) return;

        // Only populate if just 'All' exists
        if (select.options.length <= 1) {
            categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c._id;
                opt.innerText = c.name;
                select.appendChild(opt);
            });
        }
    } catch (e) { console.error('Error loading filter categories', e); }
}

window.renderAdminProducts = async function () {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

    // Ensure filters are populated
    fetchCategoriesForFilter();

    const products = await fetchProducts();

    if (products.length === 0) {
        list.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
        return;
    }

    list.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image || 'https://via.placeholder.com/50'}" class="table-img" style="width:50px; height:50px; object-fit:cover; border-radius:8px;"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category ? p.category.name : 'Uncategorized'}</td>
            <td>£${p.price.toFixed(2)}</td>
            <td>${p.stock || 0}</td>
            <td><span class="status-badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}">${p.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="editProduct('${p._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline btn-sm" onclick="deleteProduct('${p._id}')" style="color:var(--danger);"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

window.openAddProductModal = async function () {
    document.getElementById('modal-title').innerText = 'Add New Product';
    const form = document.getElementById('product-form');
    form.reset();
    form.dataset.mode = 'create';
    form.dataset.id = '';
    document.getElementById('live-preview-container').innerHTML = '<div class="preview-placeholder">Enter product details to see preview</div>';

    // Clear all images
    productImages = [];
    productFiles.clear();
    const container = document.getElementById('images-preview-container');
    container.innerHTML = '';
    container.style.display = 'none';

    // Populate Categories
    const categories = await fetchCategories();
    const catSelect = document.getElementById('p-category');
    catSelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
    categories.forEach(c => {
        catSelect.innerHTML += `<option value="${c._id}">${c.name}</option>`;
    });

    document.getElementById('product-modal').style.display = 'flex';
};

window.closeModal = function (id) {
    document.getElementById(id).style.display = 'none';
    // Clear images when closing product modal
    if (id === 'product-modal') {
        productImages = [];
        productFiles.clear();
        const container = document.getElementById('images-preview-container');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }
};

function updateLivePreview() {
    const container = document.getElementById('live-preview-container');
    if (!container) return;
    const name = (document.getElementById('p-name') && document.getElementById('p-name').value) || '';
    const priceVal = document.getElementById('p-price') && document.getElementById('p-price').value;
    const discountVal = document.getElementById('p-discount') && document.getElementById('p-discount').value;
    const price = parseFloat(priceVal) || 0;
    const discount = Math.min(100, Math.max(0, parseInt(discountVal, 10) || 0));
    const currentPrice = price * (1 - discount / 100);

    if (!name && price === 0) {
        container.innerHTML = '<div class="preview-placeholder">Enter product details to see preview</div>';
        return;
    }
    let priceHtml = '';
    if (discount > 0) {
        priceHtml = `<div style="margin-top:8px;"><span style="color:#dc2626;text-decoration:line-through;font-weight:700;">£${price.toFixed(2)}</span> <span style="color:#2563eb;font-weight:800;">£${currentPrice.toFixed(2)}</span></div>`;
    } else {
        priceHtml = `<div style="margin-top:8px;"><span style="color:#2563eb;font-weight:800;">£${price.toFixed(2)}</span></div>`;
    }
    container.innerHTML = `
        <div style="padding:12px;">
            <div style="font-weight:700;font-size:1rem;">${name || 'Product title'}</div>
            ${priceHtml}
        </div>
    `;
}

['p-name', 'p-price', 'p-discount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateLivePreview);
});

// Store product images array
let productImages = [];
let productFiles = new Map(); // Store File objects for upload

const productForm = document.getElementById('product-form');
if (productForm) {
    // Handle multiple file input change for preview
    const fileInput = document.getElementById('p-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const files = Array.from(e.target.files || []);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imageId = addImagePreview(e.target.result, file.name, 'file');
                    productFiles.set(imageId, file); // Store the File object
                };
                reader.readAsDataURL(file);
            });
            // Clear the input so same files can be selected again
            e.target.value = '';
        });
    }

    // Function to add image preview
    window.addImagePreview = function(src, name, type) {
        const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const imageData = { id: imageId, src: src, name: name, type: type };
        productImages.push(imageData);

        const container = document.getElementById('images-preview-container');
        const previewDiv = document.createElement('div');
        previewDiv.id = imageId;
        previewDiv.style.cssText = 'position: relative; border: 2px solid var(--admin-border); border-radius: 12px; overflow: hidden; aspect-ratio: 1; background: var(--admin-bg); box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease; cursor: pointer;';
        previewDiv.onmouseenter = function() { this.style.transform = 'scale(1.05)'; this.style.borderColor = 'var(--admin-primary)'; };
        previewDiv.onmouseleave = function() { this.style.transform = 'scale(1)'; this.style.borderColor = 'var(--admin-border)'; };
        
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
        img.alt = name;
        img.onerror = function() {
            this.src = 'https://via.placeholder.com/200?text=Image+Error';
        };

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.style.cssText = 'position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onmouseenter = function() { this.style.background = 'rgba(239, 68, 68, 1)'; this.style.transform = 'scale(1.1)'; };
        removeBtn.onmouseleave = function() { this.style.background = 'rgba(239, 68, 68, 0.9)'; this.style.transform = 'scale(1)'; };
        removeBtn.onclick = (e) => { e.stopPropagation(); removeImage(imageId); };

        const label = document.createElement('div');
        label.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); color: white; padding: 8px 6px 6px; font-size: 10px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-weight: 500;';
        label.textContent = type === 'file' ? (name.length > 15 ? name.substring(0, 15) + '...' : name) : 'URL Image';
        
        // Add MAIN label for first image
        if (productImages.length === 1) {
            const mainLabel = document.createElement('div');
            mainLabel.style.cssText = 'position: absolute; top: 8px; left: 8px; background: var(--admin-primary); color: white; padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: bold; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2); text-transform: uppercase; letter-spacing: 0.5px;';
            mainLabel.textContent = 'MAIN';
            previewDiv.appendChild(mainLabel);
        }

        previewDiv.appendChild(img);
        previewDiv.appendChild(removeBtn);
        previewDiv.appendChild(label);
        container.appendChild(previewDiv);
        container.style.display = 'grid';
        
        return imageId;
    };

    // Function to add image from URL
    window.addImageFromUrl = function() {
        const urlInput = document.getElementById('p-image-url');
        const url = urlInput.value.trim();
        if (url) {
            addImagePreview(url, 'URL Image', 'url');
            urlInput.value = '';
        } else {
            alert('Please enter an image URL');
        }
    };

    // Function to remove image
    window.removeImage = function(imageId) {
        productImages = productImages.filter(img => img.id !== imageId);
        productFiles.delete(imageId); // Remove file from map
        const previewDiv = document.getElementById(imageId);
        if (previewDiv) {
            previewDiv.remove();
        }
        // Hide container if no images left
        const container = document.getElementById('images-preview-container');
        if (productImages.length === 0) {
            container.style.display = 'none';
        } else {
            // Update main label if needed
            updateMainImageLabel();
        }
    };

    // Function to update main image label
    function updateMainImageLabel() {
        const container = document.getElementById('images-preview-container');
        const previews = Array.from(container.querySelectorAll('[id^="img_"]'));
        previews.forEach((preview, index) => {
            // Find existing MAIN label by text content
            const existingLabels = preview.querySelectorAll('div');
            let mainLabel = null;
            existingLabels.forEach(label => {
                if (label.textContent === 'MAIN') {
                    mainLabel = label;
                }
            });
            
            if (index === 0 && !mainLabel) {
                mainLabel = document.createElement('div');
                mainLabel.style.cssText = 'position: absolute; top: 8px; left: 8px; background: var(--admin-primary); color: white; padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: bold; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2); text-transform: uppercase; letter-spacing: 0.5px;';
                mainLabel.textContent = 'MAIN';
                preview.appendChild(mainLabel);
            } else if (index !== 0 && mainLabel) {
                mainLabel.remove();
            }
        });
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = productForm.dataset.mode;
        const id = productForm.dataset.id;

        // Upload all file images first
        const fileImages = productImages.filter(img => img.type === 'file');
        const uploadedImageUrls = [];

        // Upload file images
        for (const imgData of fileImages) {
            const file = productFiles.get(imgData.id);
            if (file) {
                try {
                    const formData = new FormData();
                    formData.append('image', file);

                    const uploadResponse = await fetch(`${API_URL}/upload/product`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });

                    const uploadResult = await uploadResponse.json();
                    if (uploadResult.success) {
                        uploadedImageUrls.push(uploadResult.data.path);
                    } else {
                        alert('Image upload failed: ' + uploadResult.message);
                        return;
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    alert('Failed to upload image: ' + imgData.name);
                    return;
                }
            }
        }

        // Collect all image URLs (uploaded files + URL images)
        const urlImages = productImages.filter(img => img.type === 'url').map(img => img.src);
        const imageUrls = [...uploadedImageUrls, ...urlImages];

        // If no images, use placeholder
        if (imageUrls.length === 0) {
            imageUrls.push('https://via.placeholder.com/300x310');
        }

        const productData = {
            name: document.getElementById('p-name').value,
            price: parseFloat(document.getElementById('p-price').value),
            discount: parseInt(document.getElementById('p-discount').value) || 0,
            category: document.getElementById('p-category').value,
            image: imageUrls[0], // First image is main image
            images: imageUrls, // All images array
            stock: parseInt(document.getElementById('p-stock').value),
            description: document.getElementById('p-description').value || ''
        };

        try {
            const url = mode === 'create' ? `${API_URL}/products` : `${API_URL}/products/${id}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });

            const res = await response.json();

            if (res.success) {
                alert('Product Saved Successfully!');
                closeModal('product-modal');
                renderAdminProducts();
                // Refresh dashboard stats as they might have changed
                const stats = await fetchDashboardStats();
                if (stats) updateStats(stats);
            } else {
                alert(res.message || 'Error saving product');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });
}

window.deleteProduct = async function (id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                renderAdminProducts();
                const stats = await fetchDashboardStats();
                if (stats) updateStats(stats);
            } else {
                alert('Failed to delete product');
            }
        } catch (e) {
            alert('Server error');
        }
    }
};

window.editProduct = async function (id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();

        if (data.success) {
            const p = data.data;
            await openAddProductModal();
            document.getElementById('modal-title').innerText = 'Edit Product';
            const form = document.getElementById('product-form');
            form.dataset.mode = 'edit';
            form.dataset.id = p._id;

            document.getElementById('p-name').value = p.name;
            document.getElementById('p-price').value = p.price;
            document.getElementById('p-discount').value = p.discount || 0;
            document.getElementById('p-stock').value = p.stock || 0;
            document.getElementById('p-description').value = p.description || '';
            document.getElementById('p-image-url').value = '';
            updateLivePreview();

            // Load multiple images if available
            productImages = [];
            productFiles.clear();
            const container = document.getElementById('images-preview-container');
            container.innerHTML = '';
            
            // If product has images array, load all of them
            if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                p.images.forEach((imgUrl, index) => {
                    addImagePreview(imgUrl, `Image ${index + 1}`, 'url');
                });
            } else if (p.image) {
                // Fallback to single image
                addImagePreview(p.image, 'Product Image', 'url');
            }
            
            // Set Category
            if (p.category) {
                const catId = typeof p.category === 'object' ? p.category._id : p.category;
                document.getElementById('p-category').value = catId;
            }
        }
    } catch (e) {
        console.error(e);
    }
};

// --- CATEGORY MANAGEMENT ---
async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`, { headers: getAuthHeaders() });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function fetchProductsByCategory(categoryId) {
    try {
        const response = await fetch(`${API_URL}/products?limit=200&category=${categoryId}`, { headers: getAuthHeaders() });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

// Default items shown for Catering when no products from API (or merged with API list)
const CATERING_DEFAULT_ITEMS = ['Frozen', 'Chips', 'Nuggets', 'Cheese Burgers', 'Lamb Doner', 'Chicken Doner', 'Drinks', 'Cleaning', 'Oil', 'Packaging', 'Flour'];

window.openCategoryItemsModal = async function (categoryId, categoryName) {
    const titleEl = document.getElementById('category-items-modal-title');
    const listEl = document.getElementById('category-items-list');
    if (!titleEl || !listEl) return;
    const modalEl = document.getElementById('category-items-modal');
    titleEl.innerText = 'Items in: ' + (categoryName || 'Category');
    listEl.innerHTML = '<li class="text-center text-light" style="padding: 16px;">Loading...</li>';
    modalEl.style.display = 'flex';

    let products = await fetchProductsByCategory(categoryId);
    const isCatering = (categoryName || '').toLowerCase() === 'catering';
    if (products.length === 0 && isCatering) {
        products = CATERING_DEFAULT_ITEMS.map(name => ({ name }));
    } else if (products.length === 0) {
        listEl.innerHTML = '<li class="text-center text-light" style="padding: 16px;">No products in this category.</li>';
        return;
    }
    listEl.innerHTML = products.map(p => `
        <li style="padding: 10px 12px; border-bottom: 1px solid var(--admin-border); display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-circle" style="font-size: 6px; color: var(--admin-primary);"></i>
            <strong>${p.name || 'Unnamed'}</strong>
        </li>
    `).join('');
};

window.renderAdminCategories = async function () {
    const list = document.getElementById('admin-category-list');
    list.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    const categories = await fetchCategories();

    if (categories.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="text-center">No categories found</td></tr>';
        return;
    }

    list.innerHTML = categories.map(c => `
        <tr>
            <td><i class="${(c.icon && c.icon.startsWith('fa')) ? c.icon : 'fas fa-box'}" style="font-size: 1.2rem; color: ${c.color || '#0d9488'};"></i></td>
            <td>
                <a href="javascript:void(0)" class="category-name-link" data-cat-id="${c._id}" data-cat-name="${(c.name || '').replace(/"/g, '&quot;')}">${c.name}</a>
            </td>
            <td>${c.priority || 0}</td>
            <td><span class="status-badge badge-success">Visible</span></td>
            <td>
                <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openCategoryItemsModal('${c._id}', '${(c.name || '').replace(/'/g, "\\'")}');" title="View items"><i class="fas fa-list"></i></button>
                <button type="button" class="btn btn-outline btn-sm" onclick="editCategory('${c._id}')"><i class="fas fa-edit"></i></button>
                <button type="button" class="btn btn-outline btn-sm" onclick="deleteCategory('${c._id}')" style="color:var(--danger);"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    list.querySelectorAll('.category-name-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const id = this.getAttribute('data-cat-id');
            const name = this.getAttribute('data-cat-name');
            window.openCategoryItemsModal(id, name);
        });
    });
};

window.openCategoryModal = function () {
    document.getElementById('cat-modal-title').innerText = 'Add New Category';
    document.getElementById('category-form').reset();
    document.getElementById('c-id').value = '';
    document.getElementById('category-modal').style.display = 'flex';
};

window.saveCategory = async function (e) {
    e.preventDefault();
    const id = document.getElementById('c-id').value;
    const catData = {
        name: document.getElementById('c-name').value,
        icon: document.getElementById('c-icon').value,
        priority: parseInt(document.getElementById('c-priority').value) || 0
    };

    try {
        const url = id ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(catData)
        });

        const res = await response.json();
        if (res.success) {
            alert('Category Saved!');
            closeModal('category-modal');
            renderAdminCategories();
        } else {
            alert(res.message);
        }
    } catch (err) { console.error(err); alert('Error saving category'); }
};

window.deleteCategory = async function (id) {
    if (confirm('Delete this category?')) {
        try {
            await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            renderAdminCategories();
        } catch (e) { alert('Error deleting'); }
    }
};

window.editCategory = async function (id) {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        if (data.success) {
            const cat = data.data.find(c => c._id === id);
            if (cat) {
                document.getElementById('cat-modal-title').innerText = 'Edit Category';
                document.getElementById('c-id').value = cat._id;
                document.getElementById('c-name').value = cat.name;
                document.getElementById('c-icon').value = cat.icon;
                document.getElementById('c-priority').value = cat.priority || 0;
                document.getElementById('category-modal').style.display = 'flex';
            }
        }
    } catch (e) { console.error(e); }
};

const categoryForm = document.getElementById('category-form');
if (categoryForm) {
    categoryForm.addEventListener('submit', window.saveCategory);
}

// --- ORDER MANAGEMENT ---
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}/orders/admin/all`, { headers: getAuthHeaders() });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

window.renderAdminOrders = async function (filter = 'All') {
    const list = document.getElementById('admin-order-list');
    list.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';

    let orders = await fetchOrders();

    if (filter !== 'All') {
        orders = orders.filter(o => o.paymentStatus === filter);
    }

    if (orders.length === 0) {
        list.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
        return;
    }

    list.innerHTML = orders.map(o => `
        <tr>
            <td>#${o._id.substring(o._id.length - 6)}</td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            <td>${o.user ? o.user.name : 'Guest'}</td>
            <td>£${o.totalAmount.toFixed(2)}</td>
            <td>
                <span class="status-badge status-${o.paymentStatus}">${o.paymentStatus}</span>
            </td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${o._id}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
};

window.filterOrders = function (status) {
    renderAdminOrders(status);
};

window.viewOrderDetails = async function (id) {
    try {
        const response = await fetch(`${API_URL}/orders/${id}`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (data.success) {
            const o = data.data;
            alert(`Order #${id}\nUser: ${o.user ? o.user.name : 'Unknown'}\nTotal: £${o.totalAmount}\nStatus: ${o.paymentStatus}`);
        }
    } catch (e) { console.error(e); }
};

// --- INVENTORY MANAGEMENT ---
window.renderAdminInventory = async function () {
    const list = document.getElementById('admin-inventory-list');
    list.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    const products = await fetchProducts();

    if (products.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-center">No inventory found</td></tr>';
        return;
    }

    list.innerHTML = products.map(p => {
        const stock = p.stock || 0;
        const statusClass = stock < 10 ? 'badge-danger' : (stock < 20 ? 'badge-warning' : 'badge-success');
        const statusText = stock < 10 ? 'Low Stock' : (stock < 20 ? 'Medium' : 'In Stock');

        return `
            <tr>
                <td><strong>${p.name}</strong><br><small>${p.category ? p.category.name : 'Uncategorized'}</small></td>
                <td>${stock} Units</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="alert('Use Edit Product to update stock')"><i class="fas fa-plus"></i> Refill</button>
                </td>
            </tr>
        `;
    }).join('');
};

// --- CUSTOMER MANAGEMENT ---
async function fetchCustomers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, { headers: getAuthHeaders() });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

window.renderAdminCustomers = async function () {
    const list = document.getElementById('admin-customer-list');
    list.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    const customers = await fetchCustomers();

    if (customers.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="text-center">No customers found</td></tr>';
        return;
    }

    list.innerHTML = customers.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.email}</td>
            <td>-</td> 
            <td><span class="status-badge ${c.role === 'admin' ? 'badge-success' : 'badge-info'}">${c.role}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="alert('View details not implemented')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
};

// --- DISCOUNT/COUPON MANAGEMENT ---
async function fetchCoupons() {
    try {
        const response = await fetch(`${API_URL}/coupons`, { headers: getAuthHeaders() });
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

window.renderAdminDiscounts = async function () {
    const list = document.getElementById('admin-coupon-list');
    list.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    // Check if "Add Coupon" button loop exists
    let addBtnContainer = document.getElementById('add-coupon-container');
    if (!addBtnContainer) {
        // Find existing toolbar or creating one if needed. 
        // Assuming there is a place in admin.html, but let's just ensure the table is populated.
        // We will assume the user has a button calling openCouponModal() in admin.html or we need to add it dynamically?
        // Based on previous patterns, we just render the list here.
    }

    const coupons = await fetchCoupons();

    if (coupons.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="text-center">No active coupons</td></tr>';
        return;
    }

    list.innerHTML = coupons.map(c => {
        const isExpired = new Date(c.expiryDate) < new Date();
        return `
            <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.discount}%</td>
                <td>${new Date(c.expiryDate).toLocaleDateString()}</td>
                <td><span class="status-badge ${isExpired ? 'badge-danger' : 'badge-success'}">${isExpired ? 'Expired' : 'Active'}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="deleteCoupon('${c._id}')" style="color:var(--danger);"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
};

window.openCouponModal = function () {
    // Assuming a generic prompt or simple modal for now if dedicated modal doesn't exist
    // But let's check if we can reuse the product modal structure or creating a new one dynamically
    // For simplicity, we'll try to use a simple prompt flow or assume a 'coupon-modal' exists.
    // Given the task, let's create a dynamic modal or use prompts for Minimum Viable Implementation if HTML is missing
    // We will inject a simple modal string if it doesn't exist

    if (!document.getElementById('coupon-modal')) {
        const modalHtml = `
            <div id="coupon-modal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;">
                <div class="modal-content" style="background:white; padding:2rem; border-radius:12px; width:400px; max-width:90%;">
                    <h3>Add New Coupon</h3>
                    <form id="coupon-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                        <input type="text" id="cp-code" placeholder="Code (e.g. SAVE10)" class="form-input" required>
                        <input type="number" id="cp-discount" placeholder="Discount %" class="form-input" min="1" max="100" required>
                        <input type="date" id="cp-expiry" class="form-input" required>
                        <button type="submit" class="btn btn-primary">Create Coupon</button>
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('coupon-modal').style.display='none'">Cancel</button>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('coupon-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('cp-code').value;
            const discount = document.getElementById('cp-discount').value;
            const expiryDate = document.getElementById('cp-expiry').value;

            try {
                const response = await fetch(`${API_URL}/coupons`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ code, discount, expiryDate })
                });
                const res = await response.json();
                if (res.success) {
                    alert('Coupon Created!');
                    document.getElementById('coupon-modal').style.display = 'none';
                    renderAdminDiscounts();
                } else {
                    alert(res.message);
                }
            } catch (err) { console.error(err); alert('Error creating coupon'); }
        });
    }
    document.getElementById('coupon-modal').style.display = 'flex';
};

window.deleteCoupon = async function (id) {
    if (confirm('Delete this coupon?')) {
        try {
            await fetch(`${API_URL}/coupons/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            renderAdminDiscounts();
        } catch (e) { alert('Error deleting coupon'); }
    }
};

// --- ANALYTICS MODULE ---
async function fetchAnalytics() {
    try {
        const response = await fetch(`${API_URL}/admin/analytics?period=30`, { headers: getAuthHeaders() });
        const data = await response.json();
        return data.success ? data.data : null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

window.renderAdminAnalytics = async function () {
    const data = await fetchAnalytics();
    if (data) {
        renderBestSellers(data.topProducts);
        initRevenueChart(data.salesByDay);
    }
};

function renderBestSellers(products) {
    const list = document.getElementById('best-sellers-list');
    if (!products || products.length === 0) {
        list.innerHTML = '<tr><td colspan="2" class="text-center">No transactions yet</td></tr>';
        return;
    }

    list.innerHTML = products.map(p => `
        <tr>
            <td>${p._id.name || 'Unknown Product'}</td>
            <td>${p.totalQuantity}</td>
        </tr>
    `).join('');
}

function initRevenueChart(salesData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Destroy existing chart if exists
    if (window.myRevenueChart) window.myRevenueChart.destroy();

    const labels = salesData.map(d => d._id); // Date strings
    const values = salesData.map(d => d.totalSales);

    window.myRevenueChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Revenue (£)',
                data: values,
                backgroundColor: '#0d9488'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
