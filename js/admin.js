// --- DATA MANAGEMENT & API CALLS ---
const API_URL = 'https://rhyl-backend-1t8dk3gij-ansaralyhs-projects.vercel.app/api';

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
};

const productForm = document.getElementById('product-form');
if (productForm) {
    // Handle file input change for preview
    const fileInput = document.getElementById('p-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('preview-img').src = e.target.result;
                    document.getElementById('image-preview').style.display = 'block';
                    document.getElementById('p-image-url').value = ''; // Clear URL input
                };
                reader.readAsDataURL(file);
            }
        });
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = productForm.dataset.mode;
        const id = productForm.dataset.id;

        let imageUrl = document.getElementById('p-image-url').value.trim();

        // If file is selected, upload it first
        const fileInput = document.getElementById('p-image-file');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);

                const uploadResponse = await fetch(`${API_URL}/upload/product`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResult.success) {
                    imageUrl = uploadResult.data.path;
                } else {
                    alert('Image upload failed: ' + uploadResult.message);
                    return;
                }
            } catch (err) {
                console.error('Upload error:', err);
                alert('Failed to upload image');
                return;
            }
        }

        const productData = {
            name: document.getElementById('p-name').value,
            price: parseFloat(document.getElementById('p-price').value),
            category: document.getElementById('p-category').value,
            image: imageUrl || 'https://via.placeholder.com/300x310',
            stock: parseInt(document.getElementById('p-stock').value),
            description: 'Product description'
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
            document.getElementById('p-stock').value = p.stock || 0;
            document.getElementById('p-image-url').value = p.image || '';
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
            <td><i class="${c.icon || 'fas fa-box'}" style="font-size: 1.2rem; color: ${c.color || '#0d9488'};"></i></td>
            <td><strong>${c.name}</strong></td>
            <td>${c.priority || 0}</td>
            <td><span class="status-badge badge-success">Visible</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="editCategory('${c._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline btn-sm" onclick="deleteCategory('${c._id}')" style="color:var(--danger);"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
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
