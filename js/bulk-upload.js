/**
 * Bulk Product Upload - CSV parse, preview, and upload to POST /api/products/bulk
 * All columns are optional; only Product Title (or first column) is used to identify a row.
 */
(function () {
    var OPTIONAL_HEADERS = [
        'Product Title',
        'Category',
        'Product Description',
        'Previous Price (£)',
        'Current Price (£)',
        'Stock Quantity',
        'Image URLs (multiple, separated by commas)',
        'Featured Product (Yes/No)',
        'Enabled (Yes/No)'
    ];

    var bulkUploadRows = [];

    function getApiUrl() {
        return typeof API_URL !== 'undefined' ? API_URL : (function () {
            var host = window.location.hostname;
            return (host === 'localhost' || host === '127.0.0.1') ? 'http://localhost:5000/api' : 'https://rhyl-backend.vercel.app/api';
        })();
    }

    function getAuthHeaders() {
        var token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (token || '')
        };
    }

    function findValue(row, headers, possibleKeys) {
        for (var i = 0; i < possibleKeys.length; i++) {
            var key = possibleKeys[i];
            for (var k in row) {
                if (row.hasOwnProperty(k) && k.trim().toLowerCase() === key.toLowerCase()) {
                    var v = row[k];
                    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
                }
            }
        }
        if (headers && headers.length > 0 && possibleKeys.length > 0) {
            var firstKey = possibleKeys[0].toLowerCase();
            for (var h = 0; h < headers.length; h++) {
                if (headers[h].trim().toLowerCase() === firstKey) {
                    var val = row[headers[h]];
                    if (val !== undefined && val !== null) return String(val).trim();
                    return '';
                }
            }
        }
        return '';
    }

    function getByIndex(row, headers, index) {
        if (!headers || index >= headers.length) return '';
        var key = headers[index];
        var v = row[key];
        return (v !== undefined && v !== null) ? String(v).trim() : '';
    }

    function normalizeRow(row, headers) {
        var name = findValue(row, headers, ['Product Title', 'product title', 'name', 'title', 'ProductTitle']);
        if (!name && headers && headers.length > 0) name = getByIndex(row, headers, 0);
        
        var category = findValue(row, headers, ['Category', 'Categories', 'category', 'categories']);
        if (!category && headers && headers.length > 1) category = getByIndex(row, headers, 1);
        
        var description = findValue(row, headers, ['Product Description', 'product description', 'description', 'Description']);
        
        var imageUrlsStr = findValue(row, headers, [
            'Product Images', 'product images', 'Image URLs', 'image urls', 
            'Image URLs (multiple, separated by commas)', 'images', 'image', 'Images'
        ]);
        var imageUrls = imageUrlsStr ? imageUrlsStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
        
        // Match Previous Price column first (avoid matching "Current Price" or generic "Price")
        var prevPriceStr = findValue(row, headers, [
            'Previous Price (£)', 'Previous Price', 'previous price',
            'Old Price', 'old price', 'Original Price', 'original price'
        ]);
        var currPriceStr = findValue(row, headers, [
            'Current Price (£)', 'Current Price', 'current price',
            'Sale Price', 'sale price', 'New Price', 'new price', 'Selling Price', 'selling price'
        ]);
        // Fallback: by column index (A=0 Product Title, B=1 Category, C=2 Description, D=3 Previous Price, E=4 Current Price)
        if (!prevPriceStr && headers && headers.length > 3) {
            var dVal = getByIndex(row, headers, 3);
            if (dVal && !isNaN(parseFloat(String(dVal).replace(/[£$,]/g, '')))) prevPriceStr = dVal;
        }
        if (!currPriceStr && headers && headers.length > 4) {
            var eVal = getByIndex(row, headers, 4);
            if (eVal && !isNaN(parseFloat(String(eVal).replace(/[£$,]/g, '')))) currPriceStr = eVal;
        }

        var prevPrice = parseFloat(String(prevPriceStr || 0).replace(/[£$,]/g, '')) || 0;
        var currPrice = parseFloat(String(currPriceStr || '').replace(/[£$,]/g, ''));
        if (isNaN(currPrice) || currPrice < 0) currPrice = prevPrice;
        
        var stockStr = findValue(row, headers, ['Stock Quantity', 'Stock', 'stock quantity', 'quantity', 'Quantity', 'Qty', 'qty']);
        var stock = Math.max(0, parseInt(stockStr, 10) || 0);
        
        var featuredStr = findValue(row, headers, ['Featured Product', 'Featured', 'featured', 'Featured Product (Yes/No)']).toLowerCase();
        var featured = featuredStr === 'yes' || featuredStr === 'true' || featuredStr === '1';

        return {
            name: name || 'Untitled Product',
            category: category,
            description: description,
            previousPrice: prevPrice,
            currentPrice: currPrice,
            stock: stock,
            imageUrls: imageUrls,
            featured: featured
        };
    }

    function renderPreview(rows) {
        var tbody = document.getElementById('bulk-preview-tbody');
        var countEl = document.getElementById('bulk-preview-count');
        if (!tbody || !countEl) return;
        countEl.textContent = rows.length;
        tbody.innerHTML = rows.map(function (r, i) {
            var imgs = r.imageUrls && r.imageUrls.length ? r.imageUrls.length : 0;
            var prevPrice = r.previousPrice != null ? r.previousPrice.toFixed(2) : '0.00';
            var currPrice = r.currentPrice != null ? r.currentPrice.toFixed(2) : '0.00';
            return '<tr style="border-bottom: 1px solid var(--admin-border);">' +
                '<td style="padding: 8px 10px;">' + (i + 1) + '</td>' +
                '<td style="padding: 8px 10px;">' + (r.name || '—') + '</td>' +
                '<td style="padding: 8px 10px;">' + (r.category || '—') + '</td>' +
                '<td style="padding: 8px 10px; text-align: right;">£' + prevPrice + '</td>' +
                '<td style="padding: 8px 10px; text-align: right;">£' + currPrice + '</td>' +
                '<td style="padding: 8px 10px; text-align: center;">' + (r.stock != null ? r.stock : '0') + '</td>' +
                '<td style="padding: 8px 10px; text-align: center;">' + (r.featured ? 'Yes' : 'No') + '</td>' +
                '<td style="padding: 8px 10px; text-align: center;">' + imgs + '</td>' +
                '</tr>';
        }).join('');
    }

    function showCsvErrors(msg) {
        var el = document.getElementById('bulk-csv-errors');
        if (el) {
            el.style.display = 'block';
            el.textContent = msg;
        }
    }

    function hideCsvErrors() {
        var el = document.getElementById('bulk-csv-errors');
        if (el) el.style.display = 'none';
    }

    function processFile(file) {
        bulkUploadRows = [];
        hideCsvErrors();
        var previewSection = document.getElementById('bulk-preview-section');
        if (!previewSection) return;

        if (!file || !file.name || !file.name.toLowerCase().endsWith('.csv')) {
            showCsvErrors('Please select a .csv file.');
            previewSection.style.display = 'none';
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var text = e.target && e.target.result;
            if (typeof Papa === 'undefined') {
                showCsvErrors('PapaParse library not loaded. Please refresh the page.');
                return;
            }
            var result = Papa.parse(text, { header: true, skipEmptyLines: true });
            var headers = result.meta && result.meta.fields ? result.meta.fields : [];
            var rows = (result.data || []).filter(function (row) {
                var name = findValue(row, headers, ['Product Title', 'product title', 'name', 'title']);
                if (name) return true;
                if (headers && headers.length > 0 && getByIndex(row, headers, 0)) return true;
                return false;
            });
            if (rows.length === 0) {
                showCsvErrors('No valid product rows found. Add at least one row with a product title (or use first column as title).');
                previewSection.style.display = 'none';
                return;
            }
            bulkUploadRows = rows.map(function (row) { return normalizeRow(row, headers); });
            renderPreview(bulkUploadRows);
            previewSection.style.display = 'block';
        };
        reader.onerror = function () {
            showCsvErrors('Failed to read the file.');
            previewSection.style.display = 'none';
        };
        reader.readAsText(file, 'UTF-8');
    }

    window.openBulkUploadModal = function () {
        bulkUploadRows = [];
        hideCsvErrors();
        var previewSection = document.getElementById('bulk-preview-section');
        var dropZone = document.getElementById('bulk-drop-zone');
        var fileInput = document.getElementById('bulk-file-input');
        if (previewSection) previewSection.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (dropZone) dropZone.classList.remove('drag-over');
        var modal = document.getElementById('bulk-upload-modal');
        if (modal) modal.style.display = 'flex';
    };

    window.confirmBulkUpload = function () {
        if (bulkUploadRows.length === 0) {
            if (window.showToast) window.showToast('No products to upload. Please select a CSV file first.', 'error');
            return;
        }
        var btn = document.getElementById('bulk-confirm-upload');
        var progressWrap = document.getElementById('bulk-progress-wrap');
        var progressBar = document.getElementById('bulk-progress-bar');
        var progressPct = document.getElementById('bulk-progress-pct');
        if (btn) btn.disabled = true;
        if (progressWrap) progressWrap.style.display = 'block';
        if (progressBar) progressBar.style.width = '10%';
        if (progressPct) progressPct.textContent = '10%';

        var payload = {
            products: bulkUploadRows.map(function (r) {
                return {
                    name: r.name,
                    category: r.category,
                    description: r.description,
                    previousPrice: Number(r.previousPrice) || 0,
                    currentPrice: Number(r.currentPrice) || Number(r.previousPrice) || 0,
                    stock: Math.max(0, parseInt(r.stock, 10) || 0),
                    imageUrls: r.imageUrls && r.imageUrls.length ? r.imageUrls : ['https://via.placeholder.com/300x310'],
                    featured: !!r.featured
                };
            })
        };

        fetch(getApiUrl() + '/products/bulk', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (progressBar) progressBar.style.width = '100%';
                if (progressPct) progressPct.textContent = '100%';
                if (data.success) {
                    var created = data.created || 0;
                    var failed = data.failed || 0;
                    var errors = data.errors || [];
                    if (window.showToast) {
                        if (failed === 0) {
                            window.showToast('Successfully uploaded ' + created + ' product(s).', 'success');
                        } else {
                            var errMsg = 'Uploaded ' + created + '. ' + failed + ' failed.';
                            if (errors.length) {
                                var first = errors[0];
                                errMsg += ' E.g. Row ' + first.row + ': ' + (first.message || '');
                            }
                            window.showToast(errMsg, 'error');
                        }
                    }
                    if (typeof renderAdminProducts === 'function') renderAdminProducts();
                    if (typeof fetchDashboardStats === 'function' && typeof updateStats === 'function') {
                        fetchDashboardStats().then(function (stats) { if (stats) updateStats(stats); });
                    }
                    setTimeout(function () { closeModal('bulk-upload-modal'); }, 800);
                } else {
                    if (window.showToast) window.showToast(data.message || 'Upload failed', 'error');
                }
            })
            .catch(function (err) {
                console.error(err);
                if (window.showToast) window.showToast('Network error. Upload failed.', 'error');
            })
            .then(function () {
                if (btn) btn.disabled = false;
                if (progressWrap) progressWrap.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
                if (progressPct) progressPct.textContent = '0%';
            });
    };

    document.addEventListener('DOMContentLoaded', function () {
        var dropZone = document.getElementById('bulk-drop-zone');
        var fileInput = document.getElementById('bulk-file-input');
        if (dropZone) {
            dropZone.addEventListener('dragover', function (e) {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', function () {
                dropZone.classList.remove('drag-over');
            });
            dropZone.addEventListener('drop', function (e) {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                if (file) processFile(file);
            });
        }
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                var file = fileInput.files && fileInput.files[0];
                if (file) processFile(file);
            });
        }

        var templateLink = document.getElementById('bulk-download-template');
        if (templateLink) {
            templateLink.addEventListener('click', function (e) {
                e.preventDefault();
                var headers = OPTIONAL_HEADERS.join(',');
                var example = '"Example Product","Grocery","A short description.","10.00","8.00","50","https://example.com/1.jpg, https://example.com/2.jpg","No","Yes"';
                var csv = headers + '\n' + example;
                var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'bulk-products-template.csv';
                a.click();
                URL.revokeObjectURL(url);
                if (window.showToast) window.showToast('Template downloaded.', 'success');
            });
        }
    });
})();
