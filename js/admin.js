// --- DATA MANAGEMENT & API CALLS ---
// API_URL is now provided by api.js to avoid re-declaration errors

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function formatPrice(price) {
    if (price === undefined || price === null) return '0';
    const num = Number(price);
    return parseFloat(num.toFixed(2)).toString();
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
                    if (typeof window.showToast === 'function') window.showToast('Access denied: You are not an admin.', 'error');
                }
            } else {
                if (typeof window.showToast === 'function') window.showToast(data.message || 'Invalid credentials', 'error');
            }
        } catch (err) {
            console.error(err);
            if (typeof window.showToast === 'function') window.showToast('Login failed. Please try again.', 'error');
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
    if (typeof window.showToast === 'function') window.showToast('You have been logged out.', 'success');
    setTimeout(function () { window.location.href = 'store.html'; }, 800);
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

    // Fetch analytics for the chart (last 7 days)
    const analytics = await fetchAnalytics('7');
    renderSalesChart(analytics ? analytics.salesByDay : null);
}

function renderSalesChart(salesData) {
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

    // Map labels and values from salesData, or use fallback if empty
    const labels = (salesData && salesData.length > 0) ? salesData.map(d => {
        // format YYYY-MM-DD to cleaner label if possible
        const parts = d._id.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d._id;
    }) : ['No Data'];

    const values = (salesData && salesData.length > 0) ? salesData.map(d => d.totalSales) : [0];

    window.dashboardSalesChart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Sales',
                data: values,
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
                            const val = context.parsed.y;
                            return '£' + formatPrice(val);
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
                            return '£' + formatPrice(value);
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
    document.getElementById('stat-sales').innerText = `£${formatPrice(stats.totalSales)}`;
}

function renderRecentOrders(orders) {
    const list = document.getElementById('recent-orders-list');
    if (!orders || orders.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-center">No recent orders</td></tr>';
        return;
    }

    function orderStatusClass(s) {
        const status = (s || 'pending').toLowerCase();
        if (status === 'confirmed' || status === 'delivered') return 'badge-success';
        if (status === 'cancelled') return 'badge-danger';
        return 'badge-warning';
    }
    function orderStatusLabel(s) {
        const status = (s || 'pending').toLowerCase();
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    list.innerHTML = orders.map(o => `
        <tr>
            <td>#${o._id.substring(o._id.length - 6)}</td>
            <td>${o.customerName || (o.user ? o.user.name : 'Guest')}</td>
            <td>£${formatPrice(o.totalAmount)}</td>
            <td><span class="status-badge ${orderStatusClass(o.status)}">${orderStatusLabel(o.status)}</span></td>
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
            <td><strong>${p.name}</strong><br><small>${Array.isArray(p.category) ? p.category.map(c => c.name).join(', ') : (p.category ? p.category.name : 'Uncategorized')}</small></td>
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
    list.innerHTML = '<tr><td colspan="8" class="text-center">Loading...</td></tr>';

    // Ensure filters are populated
    fetchCategoriesForFilter();

    const products = await fetchProducts();

    if (products.length === 0) {
        list.innerHTML = '<tr><td colspan="8" class="text-center">No products found</td></tr>';
        return;
    }

    list.innerHTML = products.map(p => {
        const previousPrice = Number(p.previousPrice || 0);
        const currentPrice = Number(p.currentPrice || p.price || 0);
        return `
        <tr>
            <td><img src="${p.image || 'https://via.placeholder.com/50'}" class="table-img" style="width:50px; height:50px; object-fit:cover; border-radius:8px;"></td>
            <td><strong>${p.name}</strong></td>
            <td>${Array.isArray(p.category) ? p.category.map(c => c.name).join(', ') : (p.category ? p.category.name : 'Uncategorized')}</td>
            <td>£${formatPrice(previousPrice)}</td>
            <td>£${formatPrice(currentPrice)}</td>
            <td>${p.stock || 0}</td>
            <td><span class="status-badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}">${p.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="editProduct('${p._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline btn-sm" onclick="deleteProduct('${p._id}')" style="color:var(--danger);"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
};

// --- CATEGORY SELECTION UI LOGIC ---
window.toggleCategoryDropdown = function () {
    const dropdown = document.getElementById('category-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
};

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    const wrapper = document.getElementById('category-select-wrapper');
    const dropdown = document.getElementById('category-dropdown');
    if (wrapper && !wrapper.contains(e.target)) {
        if (dropdown) dropdown.classList.remove('show');
    }
});

window.renderCategoryDropdown = async function (selectedIds = []) {
    const container = document.getElementById('p-categories-list');
    if (!container) return;

    const categories = await fetchCategories();

    // Grouping logic
    const groups = {
        'REGIONAL': [],
        'FRESH & GROCERY': [],
        'OTHER': []
    };

    categories.forEach(c => {
        const name = c.name.toLowerCase();
        if (name.includes('asian') || name.includes('african') || name.includes('european') || name.includes('american') || name.includes('middle eastern')) {
            groups['REGIONAL'].push(c);
        } else if (name.includes('fresh') || name.includes('grocery') || name.includes('dairy') || name.includes('meat') || name.includes('produce')) {
            groups['FRESH & GROCERY'].push(c);
        } else {
            groups['OTHER'].push(c);
        }
    });

    let html = '';
    for (const [groupName, catItems] of Object.entries(groups)) {
        if (catItems.length > 0) {
            html += `<div class="category-group-header">${groupName}</div>`;
            catItems.forEach(c => {
                const isSelected = selectedIds.includes(c._id);
                html += `
                    <div class="category-item" onclick="toggleCategorySelection('${c._id}', '${c.name.replace(/'/g, "\\'")}')">
                        <input type="checkbox" name="p-category" value="${c._id}" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); updateCategoryButtonText();">
                        <span>${c.name}</span>
                    </div>
                `;
            });
        }
    }

    container.innerHTML = html || '<div style="padding: 15px; text-align: center; color: #94a3b8;">No categories found</div>';
    updateCategoryButtonText();
};

window.toggleCategorySelection = function (id, name) {
    const checkboxes = document.querySelectorAll(`input[name="p-category"][value="${id}"]`);
    if (checkboxes.length > 0) {
        checkboxes[0].checked = !checkboxes[0].checked;
        updateCategoryButtonText();
    }
};

window.filterCategoryList = function (query) {
    const q = query.toLowerCase();
    const items = document.querySelectorAll('.category-item');
    const headers = document.querySelectorAll('.category-group-header');

    items.forEach(item => {
        const text = item.querySelector('span').innerText.toLowerCase();
        if (text.includes(q)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });

    // Hide headers if no items are visible in that group
    headers.forEach(header => {
        let sibling = header.nextElementSibling;
        let hasVisibleItems = false;
        while (sibling && sibling.classList.contains('category-item')) {
            if (sibling.style.display === 'flex') {
                hasVisibleItems = true;
                break;
            }
            sibling = sibling.nextElementSibling;
        }
        header.style.display = hasVisibleItems ? 'block' : 'none';
    });
};

window.updateCategoryButtonText = function () {
    const container = document.getElementById('selected-categories-tags');
    if (!container) return;

    const selected = Array.from(document.querySelectorAll('input[name="p-category"]:checked')).map(cb => {
        const item = cb.closest('.category-item');
        return item ? item.querySelector('span').innerText : '';
    });

    if (selected.length === 0) {
        container.innerHTML = '<span style="color: var(--admin-text-light);">Select categories...</span>';
    } else {
        container.innerHTML = selected.map(name => `<span class="tag">${name}</span>`).join('');
    }
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

    // Reset search
    const searchInput = document.getElementById('category-search');
    if (searchInput) searchInput.value = '';

    // Populate Categories Dropdown
    await renderCategoryDropdown();

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
    const currentPriceVal = document.getElementById('p-current-price') && document.getElementById('p-current-price').value;
    const price = parseFloat(priceVal) || 0;
    const currentPrice = parseFloat(currentPriceVal) || 0;
    const discount = price > 0 ? Math.max(0, Math.min(100, Math.round((1 - currentPrice / price) * 100))) : 0;

    if (!name && price === 0 && (typeof productImages === 'undefined' || productImages.length === 0)) {
        container.innerHTML = '<div class="preview-placeholder">Enter product details to see preview</div>';
        return;
    }

    let priceHtml = '';
    if (currentPrice > 0 && currentPrice < price) {
        priceHtml = `<div style="margin-top:8px;"><span style="color:#dc2626;text-decoration:line-through;font-weight:700;">£${formatPrice(price)}</span> <span style="color:#2563eb;font-weight:800;">£${formatPrice(currentPrice)}</span> <span style="color:#059669;font-size:0.85rem;margin-left:5px;">(${discount}% off)</span></div>`;
    } else {
        priceHtml = `<div style="margin-top:8px;"><span style="color:#2563eb;font-weight:800;">£${formatPrice(currentPrice || price)}</span></div>`;
    }

    let imgHtml = '';
    if (typeof productImages !== 'undefined' && productImages.length > 0) {
        imgHtml = `<img src="${productImages[0].src}" style="width:100%; height:200px; object-fit:contain; border-radius:12px; margin-bottom:12px;">`;
    } else {
        imgHtml = `<div style="width:100%; height:200px; display:flex; align-items:center; justify-content:center; background:var(--admin-bg); border-radius:12px; margin-bottom:12px; color:var(--admin-text-light);"><i class="fas fa-image" style="font-size:3rem; opacity:0.3;"></i></div>`;
    }

    container.innerHTML = `
        <div style="padding:12px; width: 100%; text-align: center; border: 1px solid var(--admin-border); border-radius: 16px; background: var(--admin-card-bg);">
            ${imgHtml}
            <div style="font-weight:700;font-size:1rem;">${name || 'Product title'}</div>
            ${priceHtml}
        </div>
    `;
}

['p-name', 'p-price', 'p-current-price'].forEach(id => {
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
    window.addImagePreview = function (src, name, type) {
        const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const imageData = { id: imageId, src: src, name: name, type: type };
        productImages.push(imageData);

        const container = document.getElementById('images-preview-container');
        const previewDiv = document.createElement('div');
        previewDiv.id = imageId;
        previewDiv.style.cssText = 'position: relative; border: 2px solid var(--admin-border); border-radius: 12px; overflow: hidden; aspect-ratio: 1; background: var(--admin-bg); box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease; cursor: pointer;';
        previewDiv.onmouseenter = function () { this.style.transform = 'scale(1.05)'; this.style.borderColor = 'var(--admin-primary)'; };
        previewDiv.onmouseleave = function () { this.style.transform = 'scale(1)'; this.style.borderColor = 'var(--admin-border)'; };

        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
        img.alt = name;
        img.onerror = function () {
            this.src = 'https://via.placeholder.com/200?text=Image+Error';
        };

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.style.cssText = 'position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onmouseenter = function () { this.style.background = 'rgba(239, 68, 68, 1)'; this.style.transform = 'scale(1.1)'; };
        removeBtn.onmouseleave = function () { this.style.background = 'rgba(239, 68, 68, 0.9)'; this.style.transform = 'scale(1)'; };
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

        updateLivePreview();
        return imageId;
    };

    // Function to add image from URL
    window.addImageFromUrl = function () {
        const urlInput = document.getElementById('p-image-url');
        const url = urlInput.value.trim();
        if (url) {
            addImagePreview(url, 'URL Image', 'url');
            urlInput.value = '';
        } else {
            (window.showToast && window.showToast('Please enter an image URL', 'error'));
        }
    };

    // Function to remove image
    window.removeImage = function (imageId) {
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
        updateLivePreview();
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
        const submitBtn = productForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Disable button to prevent duplicates
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

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
                        (window.showToast && window.showToast('Image upload failed: ' + uploadResult.message, 'error'));
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                        return;
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    (window.showToast && window.showToast('Failed to upload image: ' + imgData.name, 'error'));
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
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

        const previousPrice = parseFloat(document.getElementById('p-price').value) || 0;
        const currentPrice = parseFloat(document.getElementById('p-current-price').value) || previousPrice;

        // Discount is now purely informational or calculated for legacy reasons
        const discount = previousPrice > 0 ? Math.max(0, Math.min(100, Math.round((1 - currentPrice / previousPrice) * 100))) : 0;

        const selectedCategories = Array.from(document.querySelectorAll('input[name="p-category"]:checked')).map(cb => cb.value);

        const productData = {
            name: document.getElementById('p-name').value,
            price: currentPrice, // price field kept for backward compatibility (set to current)
            previousPrice: previousPrice,
            currentPrice: currentPrice,
            discount: discount,
            category: selectedCategories,
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
                if (window.showToast) window.showToast('Product Saved Successfully!', 'success');
                closeModal('product-modal');
                renderAdminProducts();

                // ✅ Broadcast change to other tabs (Store UI)
                const syncChannel = new BroadcastChannel('rhyl-sync');
                syncChannel.postMessage({ type: 'product-updated' });
                syncChannel.close();

                // Refresh dashboard stats as they might have changed
                const stats = await fetchDashboardStats();
                if (stats) updateStats(stats);
            } else {
                if (window.showToast) window.showToast(res.message || 'Error saving product', 'error');
            }
        } catch (err) {
            console.error(err);
            if (window.showToast) window.showToast('Server error', 'error');
        } finally {
            // Re-enable button after completion (either success or failure)
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
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
                if (window.showToast) window.showToast('Failed to delete product', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Server error', 'error');
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
            const prevPrice = p.previousPrice || 0;
            const currPrice = p.currentPrice || p.price || 0;

            document.getElementById('p-price').value = prevPrice > 0 ? formatPrice(prevPrice) : '';
            document.getElementById('p-current-price').value = formatPrice(currPrice);
            document.getElementById('p-stock').value = p.stock || 0;
            document.getElementById('p-description').value = p.description || '';
            document.getElementById('p-image-url').value = '';

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

            // Reset search
            const searchInput = document.getElementById('category-search');
            if (searchInput) searchInput.value = '';

            updateLivePreview();

            // Set Category (Multi-select)
            if (p.category) {
                const categoryIds = Array.isArray(p.category)
                    ? p.category.map(c => typeof c === 'object' ? c._id : c)
                    : [typeof p.category === 'object' ? p.category._id : p.category];

                await renderCategoryDropdown(categoryIds);
            } else {
                await renderCategoryDropdown();
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
            if (window.showToast) window.showToast('Category Saved!', 'success');
            closeModal('category-modal');
            renderAdminCategories();
        } else {
            if (window.showToast) window.showToast(res.message, 'error');
        }
    } catch (err) { console.error(err); if (window.showToast) window.showToast('Error saving category', 'error'); }
};

window.deleteCategory = async function (id) {
    if (confirm('Delete this category?')) {
        try {
            await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            renderAdminCategories();
        } catch (e) { if (window.showToast) window.showToast('Error deleting', 'error'); }
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
        orders = orders.filter(o => (o.status || '').toLowerCase() === filter.toLowerCase());
    }

    if (orders.length === 0) {
        list.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
        return;
    }

    list.innerHTML = orders.map(o => `
        <tr>
            <td>#${o._id.substring(o._id.length - 6)}</td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            <td>${o.customerName || (o.user ? o.user.name : 'Guest')}</td>
            <td>£${formatPrice(o.totalAmount)}</td>
            <td>
                <select class="form-control status-select" onchange="updateOrderStatus('${o._id}', this.value)" style="padding: 4px 8px; font-size: 0.8rem; height: auto; width: auto; border-radius: 6px; border-color: var(--admin-border);">
                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
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

window.updateOrderStatus = async function (id, newStatus) {
    try {
        if (!window.api || !window.api.orders) {
            console.error('API helper not found');
            if (window.showToast) window.showToast('Initialization error: api.js missing', 'error');
            return;
        }

        const response = await window.api.orders.updateStatus(id, { status: newStatus });
        if (response.success) {
            if (window.showToast) window.showToast(response.message || 'Order updated successfully.', 'success');
            const currentFilter = document.querySelector('#tab-orders .header-actions select').value;
            renderAdminOrders(currentFilter);
        } else {
            if (window.showToast) window.showToast(response.message || 'Error updating status', 'error');
        }
    } catch (e) {
        console.error(e);
        if (window.showToast) window.showToast('Failed to update order status', 'error');
    }
};

window.viewOrderDetails = async function (id) {
    const modal = document.getElementById('order-details-modal');
    const loading = document.getElementById('order-details-loading');
    const content = document.getElementById('order-details-content');
    const errEl = document.getElementById('order-details-error');
    if (!modal || !loading || !content || !errEl) return;

    loading.style.display = 'block';
    content.style.display = 'none';
    errEl.style.display = 'none';
    modal.style.display = 'flex';

    try {
        const response = await fetch(`${API_URL}/orders/${id}`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!data.success) {
            errEl.textContent = data.message || 'Order not found';
            errEl.style.display = 'block';
            loading.style.display = 'none';
            return;
        }
        const o = data.data;

        document.getElementById('order-details-modal-title').textContent = 'Order #' + (o._id ? o._id.substring(o._id.length - 6) : id);
        document.getElementById('order-detail-id').textContent = '#' + (o._id ? o._id.substring(o._id.length - 6) : id);
        document.getElementById('order-detail-date').textContent = o.createdAt ? new Date(o.createdAt).toLocaleString() : '—';
        document.getElementById('order-detail-customer').textContent = o.customerName || (o.user && o.user.name) || 'Guest';
        document.getElementById('order-detail-email').textContent = o.customerEmail || '—';
        document.getElementById('order-detail-phone').textContent = o.customerPhone || '—';
        document.getElementById('order-detail-status').textContent = (o.status || 'pending').charAt(0).toUpperCase() + (o.status || '').slice(1);
        document.getElementById('order-detail-payment').textContent = (o.paymentMethod || '—') + (o.paymentStatus ? ' · ' + o.paymentStatus : '');
        const addr = o.shippingAddress;
        document.getElementById('order-detail-shipping').textContent = addr && (addr.street || addr.city || addr.postcode) ? [addr.street, addr.city, addr.postcode, addr.country].filter(Boolean).join(', ') : '—';

        const items = o.items || [];
        const tbody = document.getElementById('order-details-items');
        tbody.innerHTML = items.map(function (item) {
            const product = item.product;
            const name = product && (product.name || product.title) ? (product.name || product.title) : 'Product';
            const qty = item.quantity || 0;
            const price = item.price != null ? item.price : 0;
            const subtotal = formatPrice(qty * price);
            return '<tr style="border-bottom: 1px solid var(--admin-border);"><td style="padding: 10px 12px;">' + name + '</td><td style="padding: 10px 12px; text-align: right;">' + qty + '</td><td style="padding: 10px 12px; text-align: right;">£' + formatPrice(price) + '</td><td style="padding: 10px 12px; text-align: right;">£' + subtotal + '</td></tr>';
        }).join('');

        document.getElementById('order-details-total').textContent = '£' + (o.totalAmount != null ? formatPrice(o.totalAmount) : '0');
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (e) {
        console.error(e);
        errEl.textContent = 'Failed to load order details.';
        errEl.style.display = 'block';
        loading.style.display = 'none';
    }
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
                <td><strong>${p.name}</strong><br><small>${Array.isArray(p.category) ? p.category.map(c => c.name).join(', ') : (p.category ? p.category.name : 'Uncategorized')}</small></td>
                <td>${stock} Units</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="window.showToast && window.showToast('Use Edit Product to update stock', 'info')"><i class="fas fa-plus"></i> Refill</button>
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
                <button class="btn btn-outline btn-sm" onclick="viewCustomer('${c._id}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
};

window.viewCustomer = async function (id) {
    try {
        const response = await fetch(`${API_URL}/admin/users`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (data.success) {
            const customer = data.data.find(c => c._id === id);
            if (customer) {
                document.getElementById('cust-detail-name').innerText = customer.name;
                document.getElementById('cust-detail-email').innerText = customer.email;
                document.getElementById('cust-detail-role').innerText = customer.role;
                document.getElementById('cust-detail-id').innerText = customer._id;
                document.getElementById('cust-detail-avatar').src = `https://i.pravatar.cc/150?u=${customer.email}`;

                document.getElementById('customer-details-modal').style.display = 'flex';
            }
        }
    } catch (e) {
        console.error('Error viewing customer:', e);
        if (window.showToast) window.showToast('Error loading customer details', 'error');
    }
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
                    if (window.showToast) window.showToast('Coupon Created!', 'success');
                    document.getElementById('coupon-modal').style.display = 'none';
                    renderAdminDiscounts();
                } else {
                    if (window.showToast) window.showToast(res.message, 'error');
                }
            } catch (err) { console.error(err); if (window.showToast) window.showToast('Error creating coupon', 'error'); }
        });
    }
    document.getElementById('coupon-modal').style.display = 'flex';
};

window.deleteCoupon = async function (id) {
    if (confirm('Delete this coupon?')) {
        try {
            await fetch(`${API_URL}/coupons/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            renderAdminDiscounts();
        } catch (e) { if (window.showToast) window.showToast('Error deleting coupon', 'error'); }
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
