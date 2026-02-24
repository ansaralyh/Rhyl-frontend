// Use local API when on localhost, else deployed backend base URL
const API_URL = (function () {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    return 'https://rhyl-backend.vercel.app/api';
})();

document.addEventListener('alpine:init', () => {
    Alpine.data('indexPage', () => ({
        mobileMenuOpen: false,
        mobileSearchOpen: false,
        cartDrawerOpen: false,
        wishlistDrawerOpen: false,
        shareModalOpen: false,
        deliveryPopupOpen: false,
        shareProductName: '',
        cartTotal: 0,
        cateringDefaultItems: ['Frozen', 'Chips', 'Nuggets', 'Cheese Burgers', 'Lamb Doner', 'Chicken Doner', 'Drinks', 'Cleaning', 'Oil', 'Packaging', 'Flour'],
        isLoggedIn: false,
        isAdminLoggedIn: false,
        user: { name: 'Guest' },
        sliderIndex: 0,
        heroSliderIndex: 0,
        heroBannerIndex: 0,

        // Hero Banner Images
        heroBanners: [
            { image: 'images/banner1.jpg', alt: 'Grocery Shopping - Fresh Every Day' },
            { image: 'images/banner2.jpg', alt: 'Grocery Grab - Delivery to Your Home' },
            { image: 'images/banner3.jpg', alt: 'Super Market - Fresh & Healthy' }
        ],
        dropdownOpen: false,

        // Data Arrays
        heroSlides: [
            {
                id: 1,
                type: 'collage',
                title: 'We Believe in Quality and Services',
                subtitle: 'Premium Selection',
                desc: 'Experience the best products delivered to your doorstep.',
                cta: 'Buy Online',
                accent: 'yellow',
                images: ['images/coke-bottle.png', 'images/rocket.png', 'images/baby-diapers.png', 'images/laundry-detergent.png']
            }
        ],

        promoBannerSlides: [
            { id: 1, title: 'Weekend Mega Sale', discount: 'Up to 50% OFF', desc: 'Get huge discounts on pantry staples this weekend only.', bg: 'bg-indigo-600', image: 'images/shopping-bags-and-products.jpg' },
            { id: 2, title: 'Freshness Guaranteed', discount: 'Fresh Produce', desc: 'Farm fresh vegetables delivered straight to your doorstep.', bg: 'bg-emerald-600', image: 'images/grocery-shopping-fresh-produce-and-products.jpg' },
            { id: 3, title: 'Beauty Bonanza', discount: 'Buy 1 Get 1', desc: 'Exclusive offers on top brand shampoos and skincare.', bg: 'bg-pink-600', image: 'images/vitamin-c-serum.png' }
        ],

        promoBannerIndex: 0,

        dairyBannerSlides: [
            { id: 1, title: 'Fresh Dairy Deals', discount: 'Flat 20% OFF', desc: 'Starting your day with pure, calcium-rich milk and cheese.', bg: 'bg-sky-600', image: 'images/baby-formula.jpg' },
            { id: 2, title: 'Yogurt Festival', discount: 'Buy 2 Get 1', desc: 'Creamy, probiotic-rich yogurt available in all flavors.', bg: 'bg-teal-600', image: 'images/baby-formula.jpg' },
            { id: 3, title: 'Cheese Lovers', discount: 'Special Price', desc: 'Premium cheddar and mozzarella blocks for your recipes.', bg: 'bg-blue-600', image: 'images/grocery-shopping-fresh-produce-and-products.jpg' }
        ],

        dairyBannerIndex: 0,

        packagedBannerSlides: [
            { id: 1, title: 'Pantry Essentials', discount: 'Bundle Offer', desc: 'Stock up on ketchups, sauces, and instant meals.', bg: 'bg-red-600', image: 'images/fresh-orange-juice.png' },
            { id: 2, title: 'Canned Delights', discount: 'Buy 3 Get 1', desc: 'Premium quality canned fruits and vegetables for your convenience.', bg: 'bg-amber-600', image: 'images/frozen-mixed-vegetables.jpg' },
            { id: 3, title: 'Sauce & Spices', discount: 'Flat 15% OFF', desc: 'Add zest to your meals with our range of soy and chilli sauces.', bg: 'bg-orange-600', image: 'images/extra-virgin-olive-oil.jpg' }
        ],

        packagedBannerIndex: 0,

        beverageBannerSlides: [
            { id: 1, title: 'Summer Refreshers', discount: 'Buy 1 Get 1', desc: 'Beat the heat with our chilled variety of juices and sodas.', bg: 'bg-lime-600', image: 'images/fresh-orange-juice.png' },
            { id: 2, title: 'Tea & Coffee Time', discount: 'Combo Saver', desc: 'Premium tea blends and roasts for your perfect morning brew.', bg: 'bg-emerald-600', image: 'images/green-tea-bags.jpg' },
            { id: 3, title: 'Energize Your Day', discount: 'Flat 20% OFF', desc: 'Sports drinks and energy boosters at unbeatable prices.', bg: 'bg-cyan-600', image: 'images/grocery-shopping-fresh-produce-and-products.jpg' }
        ],

        beverageBannerIndex: 0,

        // New Categorized Product Arrays
        freshProduce: [],
        groceryStaples: [],
        spicesMasala: [],
        dairyProducts: [],
        meatFrozen: [],
        packagedCanned: [],
        snacksBakery: [],
        beverages: [],
        householdCleaning: [],
        personalCare: [],
        asianProducts: [],
        africanProducts: [],
        babyProducts: [],
        cateringProducts: [],
        thaiPhilippinesProducts: [],

        sliderProducts: [],
        topProducts: [],
        cart: [],
        wishlist: [],
        productsLoaded: false,

        devPopupOpen: false,
        countdown: { hours: 10, minutes: 0 },

        formatPrice(price) {
            if (price === undefined || price === null) return '0';
            const num = Number(price);
            return parseFloat(num.toFixed(2)).toString();
        },

        async init() {
            this.isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
            this.isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';

            // Development Popup Logic
            this.initCountdown();
            this.devPopupOpen = true;

            // Load cart/wishlist from local storage (client-side persist only for now)
            const savedCart = localStorage.getItem('cart');
            if (savedCart) this.cart = JSON.parse(savedCart);

            const savedWish = localStorage.getItem('wishlist');
            if (savedWish) this.wishlist = JSON.parse(savedWish);
            this.wishlistCount = this.wishlist.length;

            await this.fetchProducts();

            this.updateCartCount();

            // Open drawer if hash exists
            if (window.location.hash === '#cart') {
                this.cartDrawerOpen = true;
            } else if (window.location.hash === '#wishlist') {
                this.wishlistDrawerOpen = true;
            }

            // Start sliders
            this.startHeroBannerSlider();
            this.startFeaturedSlider();
            this.startPromoSlider();
            this.startDairySlider();
            this.startPackagedSlider();
            this.startBeverageSlider();

            // ✅ Listen for sync messages from other tabs
            const syncChannel = new BroadcastChannel('rhyl-sync');
            syncChannel.onmessage = (event) => {
                if (event.data.type === 'product-updated') {
                    console.log('Syncing products due to update in another tab...');
                    this.fetchProducts();
                }
            };

            // Initialize icons
            setTimeout(() => {
                if (window.lucide) lucide.createIcons();
            }, 100);
        },

        async fetchProducts() {
            try {
                // Add cache buster to ensure immediate updates are fetched
                const response = await fetch(`${API_URL}/products?limit=200&_t=${Date.now()}`);
                const contentType = response.headers.get('content-type') || '';
                if (!response.ok || !contentType.includes('application/json')) {
                    console.warn('Products API returned non-JSON or error:', response.status, response.statusText);
                    return;
                }
                let result;
                try {
                    result = await response.json();
                } catch (parseErr) {
                    console.warn('Products API response was not valid JSON:', parseErr.message);
                    return;
                }

                if (result.success) {
                    const allProducts = result.data;

                    // Get all category names for a product (lowercase)
                    const getCatNames = (p) => {
                        if (!p.category) return [];
                        if (Array.isArray(p.category)) {
                            return p.category.map(c => (c.name || c || '').toString().toLowerCase().trim());
                        }
                        return [(p.category.name || p.category || '').toString().toLowerCase().trim()];
                    };

                    // Check if product has a category containing ANY of the keywords
                    const matchesAny = (p, keywords) => {
                        const names = getCatNames(p);
                        return names.some(catName =>
                            keywords.some(kw => catName.includes(kw.toLowerCase()))
                        );
                    };

                    // Category filters using partial matching (case-insensitive)
                    this.freshProduce = allProducts.filter(p => matchesAny(p, ['fresh', 'produce', 'vegetable', 'fruit']));
                    this.groceryStaples = allProducts.filter(p => matchesAny(p, ['grocery', 'staple', 'rice', 'flour', 'oil', 'sugar', 'salt']));
                    this.spicesMasala = allProducts.filter(p => matchesAny(p, ['spice', 'masala', 'seasoning', 'herb']));
                    this.dairyProducts = allProducts.filter(p => matchesAny(p, ['dairy', 'milk', 'cheese', 'butter', 'yogurt', 'cream']));
                    this.meatFrozen = allProducts.filter(p => matchesAny(p, ['meat', 'frozen', 'chicken', 'beef', 'lamb', 'fish', 'seafood']));
                    this.packagedCanned = allProducts.filter(p => matchesAny(p, ['packaged', 'canned', 'tinned', 'preserved']));
                    this.snacksBakery = allProducts.filter(p => matchesAny(p, ['snack', 'bakery', 'biscuit', 'chips', 'cookies', 'bread', 'cake']));
                    this.beverages = allProducts.filter(p => matchesAny(p, ['beverage', 'drink', 'juice', 'soda', 'water', 'tea', 'coffee']));
                    this.householdCleaning = allProducts.filter(p => matchesAny(p, ['household', 'cleaning', 'detergent', 'soap', 'cleaner']));
                    this.personalCare = allProducts.filter(p => matchesAny(p, ['personal', 'care', 'hygiene', 'cosmetic', 'beauty', 'shampoo', 'toothpaste']));

                    this.asianProducts = allProducts.filter(p => matchesAny(p, ['asian', 'pakistani', 'indian', 'chinese', 'japanese', 'korean', 'bangladeshi']));
                    this.africanProducts = allProducts.filter(p => matchesAny(p, ['african', 'nigeria', 'ghana', 'caribbean']));
                    this.babyProducts = allProducts.filter(p => matchesAny(p, ['baby', 'infant', 'toddler', 'nappy', 'diaper']));
                    this.cateringProducts = allProducts.filter(p => matchesAny(p, ['catering', 'bulk', 'wholesale', 'restaurant']));
                    this.thaiPhilippinesProducts = allProducts.filter(p => matchesAny(p, ['thai', 'philippines', 'filipino', 'vietnam', 'southeast']));

                    // Debug logging
                    console.log('=== Product Category Debug ===');
                    console.log('Total products loaded:', allProducts.length);
                    console.log('Fresh Produce:', this.freshProduce.length);
                    console.log('Catering Products:', this.cateringProducts.length);
                    console.log('Asian Products:', this.asianProducts.length);
                    console.log('African Products:', this.africanProducts.length);
                    console.log('Grocery & Staples:', this.groceryStaples.length);
                    console.log('Spices & Masala:', this.spicesMasala.length);
                    console.log('Dairy Products:', this.dairyProducts.length);
                    console.log('Meat & Frozen:', this.meatFrozen.length);
                    console.log('Packaged & Canned:', this.packagedCanned.length);
                    console.log('Snacks & Bakery:', this.snacksBakery.length);
                    console.log('Beverages:', this.beverages.length);
                    console.log('Household & Cleaning:', this.householdCleaning.length);
                    console.log('Personal Care:', this.personalCare.length);
                    console.log('Thai & Philippines:', this.thaiPhilippinesProducts.length);
                    console.log('Baby Products:', this.babyProducts.length);
                    if (allProducts.length > 0) {
                        console.log('Sample product categories:', allProducts.slice(0, 5).map(p => ({
                            name: p.name,
                            categories: Array.isArray(p.category) ? p.category.map(c => c.name || c) : [p.category?.name || p.category]
                        })));
                    }

                    // Slider & Top Products Logic
                    this.sliderProducts = allProducts.filter(p => p.featured || p.rating >= 4.5).slice(0, 5);
                    this.topProducts = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);

                    this.productsLoaded = true;
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        },

        startHeroSlider() { },

        startHeroBannerSlider() {
            setInterval(() => {
                this.heroBannerIndex = (this.heroBannerIndex + 1) % this.heroBanners.length;
            }, 4000);
        },

        startFeaturedSlider() {
            setInterval(() => {
                if (this.sliderProducts.length > 0)
                    this.sliderIndex = (this.sliderIndex + 1) % this.sliderProducts.length;
            }, 2500);
        },

        startPromoSlider() {
            setInterval(() => {
                this.promoBannerIndex = (this.promoBannerIndex + 1) % this.promoBannerSlides.length;
            }, 3500);
        },

        startDairySlider() {
            setInterval(() => {
                this.dairyBannerIndex = (this.dairyBannerIndex + 1) % this.dairyBannerSlides.length;
            }, 4000);
        },

        startPackagedSlider() {
            setInterval(() => {
                this.packagedBannerIndex = (this.packagedBannerIndex + 1) % this.packagedBannerSlides.length;
            }, 5000);
        },

        startBeverageSlider() {
            setInterval(() => {
                this.beverageBannerIndex = (this.beverageBannerIndex + 1) % this.beverageBannerSlides.length;
            }, 3000);
        },

        initCountdown() {
            const duration = 10 * 60 * 60 * 1000; // 10 hours
            let targetTime = localStorage.getItem('dev_target_time');

            if (!targetTime) {
                targetTime = Date.now() + duration;
                localStorage.setItem('dev_target_time', targetTime);
            } else {
                targetTime = parseInt(targetTime);
                if (Date.now() > targetTime) {
                    targetTime = Date.now() + duration;
                    localStorage.setItem('dev_target_time', targetTime);
                }
            }

            const update = () => {
                const now = Date.now();
                const diff = targetTime - now;

                if (diff <= 0) {
                    this.countdown = { hours: 0, minutes: 0 };
                    return;
                }

                this.countdown.hours = Math.floor(diff / (1000 * 60 * 60));
                this.countdown.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            };

            update();
            setInterval(update, 60000);
        },

        // Cart & Wishlist Logic (use current price after discount)
        getCurrentPrice(product) {
            const discount = product.discount || 0;
            return product.price * (1 - discount / 100);
        },
        addToCart(product) {
            const currentPrice = this.getCurrentPrice(product);
            const cartProduct = { ...product, price: currentPrice };
            const existing = this.cart.find(item => item._id === product._id); // Changed to _id
            if (existing) {
                existing.quantity++;
            } else {
                this.cart.push({ ...cartProduct, quantity: 1 });
            }
            this.updateCartCount();
            this.showNotification('Added to cart');
        },
        updateCartCount() {
            this.cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            this.cartTotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            localStorage.setItem('cart', JSON.stringify(this.cart));
        },
        toggleWishlist(product) {
            const index = this.wishlist.findIndex(item => item._id === product._id); // Changed to _id
            if (index > -1) {
                this.wishlist.splice(index, 1);
                this.showNotification('Removed from wishlist');
            } else {
                this.wishlist.push(product);
                this.showNotification('Added to wishlist');
            }
            this.wishlistCount = this.wishlist.length;
            localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
        },
        isInWishlist(productId) {
            return this.wishlist.some(item => item._id === productId);
        },
        openShareModal(productName) {
            this.shareProductName = productName;
            this.shareModalOpen = true;
            const url = window.location.href;
            if (navigator.share) {
                navigator.share({
                    title: productName,
                    text: `Check out ${productName} on Rhyl Super Store!`,
                    url: url
                }).catch(() => { });
            } else {
                this.showNotification('Share link copied!');
                navigator.clipboard.writeText(url);
            }
        },
        openProductDetail(product) {
            // Navigate to product detail page
            window.location.href = `product-detail.html?id=${product._id}`;
        },
        logout() {
            this.isLoggedIn = false;
            this.isAdminLoggedIn = false;
            this.user = { name: 'Guest' };
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window.showToast === 'function') window.showToast('You have been logged out.', 'success');
            setTimeout(function () { window.location.href = 'store.html'; }, 800);
        },
        showNotification(message) {
            const el = document.createElement('div');
            el.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-fade-in-up';
            el.textContent = message;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3000);
        }
    }));

    Alpine.data('categoryPage', () => ({
        categoryTitle: 'Products',
        allCategoryProducts: [],
        categoryProducts: [],
        currentPage: 1,
        itemsPerPage: 20,
        totalPages: 1,
        loading: true,

        init() {
            const params = new URLSearchParams(window.location.search);
            const categorySlug = params.get('category');

            if (!categorySlug) {
                this.loading = false;
                return;
            }

            const categoryMap = {
                'produce-products': { title: 'Fresh Produce', key: 'freshProduce' },
                'grocery-staples': { title: 'Grocery & Staples', key: 'groceryStaples' },
                'spices-masala': { title: 'Spices & Masala', key: 'spicesMasala' },
                'dairy-products': { title: 'Dairy Products', key: 'dairyProducts' },
                'meat-frozen': { title: 'Meat & Frozen', key: 'meatFrozen' },
                'packaged-canned': { title: 'Packaged & Canned', key: 'packagedCanned' },
                'snacks-bakery': { title: 'Snacks & Bakery', key: 'snacksBakery' },
                'beverages': { title: 'Beverages', key: 'beverages' },
                'household-cleaning': { title: 'Household & Cleaning', key: 'householdCleaning' },
                'personal-care': { title: 'Personal Care', key: 'personalCare' },
                'asian-products': { title: 'Asian Products', key: 'asianProducts' },
                'african-products': { title: 'African Products', key: 'africanProducts' },
                'baby-products': { title: 'Baby Products', key: 'babyProducts' },
                'catering-products': { title: 'Catering Products', key: 'cateringProducts' },
                'thai-philippines-products': { title: 'Thai & Philippines Products', key: 'thaiPhilippinesProducts' }
            };

            const mapping = categoryMap[categorySlug];
            if (mapping) {
                this.categoryTitle = mapping.title;

                // Watch the parent's productsLoaded state
                if (this.productsLoaded) {
                    this.loadCategoryProducts(mapping.key);
                } else {
                    this.$watch('productsLoaded', (value) => {
                        if (value) {
                            this.loadCategoryProducts(mapping.key);
                        }
                    });
                }
            } else {
                this.loading = false;
            }
        },

        loadCategoryProducts(key) {
            // Using Alpine's merging behavior to access the parent component array
            this.allCategoryProducts = this[key] || [];
            this.totalPages = Math.ceil(this.allCategoryProducts.length / this.itemsPerPage) || 1;
            this.loading = false;
            this.updatePage();
        },

        updatePage() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            this.categoryProducts = this.allCategoryProducts.slice(start, end);
        },

        changePage(offset) {
            const newPage = this.currentPage + offset;
            if (newPage >= 1 && newPage <= this.totalPages) {
                this.currentPage = newPage;
                this.updatePage();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }));

    Alpine.data('loginPage', () => ({
        email: '',
        password: '',
        loading: false,
        error: '',
        async handleSubmit() {
            this.loading = true;
            this.error = '';
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.email, password: this.password })
                });

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    this.error = response.ok ? 'Invalid response from server.' : (response.statusText || 'Login failed. Please try again.');
                    this.loading = false;
                    return;
                }

                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    this.error = 'Login failed. Please try again.';
                    this.loading = false;
                    return;
                }

                if (!response.ok) {
                    this.error = data.message || data.error || response.statusText || 'Login failed. Please try again.';
                    this.loading = false;
                    return;
                }

                if (data.success) {
                    const userData = data.data;
                    localStorage.setItem('token', userData.token);
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('userLoggedIn', 'true');
                    if (typeof window.showToast === 'function') window.showToast('Login successful!', 'success');
                    if (userData.role === 'admin') {
                        localStorage.setItem('adminLoggedIn', 'true');
                        setTimeout(function () { window.location.href = 'admin.html'; }, 800);
                    } else {
                        setTimeout(function () { window.location.href = 'store.html'; }, 800);
                    }
                } else {
                    this.error = data.message || 'Invalid credentials';
                }
            } catch (err) {
                console.error('Login error:', err);
                // Check for network/CORS errors
                if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                    this.error = 'Cannot connect to server. Please check your internet connection.';
                } else {
                    this.error = 'Login failed. Please try again.';
                }
            } finally {
                this.loading = false;
            }
        }
    }));

    Alpine.data('signupPage', () => ({
        name: '',
        email: '',
        password: '',
        loading: false,
        async handleSubmit() {
            this.loading = true;
            try {
                const response = await fetch(`${API_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: this.name, email: this.email, password: this.password })
                });
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    if (typeof window.showToast === 'function') window.showToast('Server returned an unexpected response. Please try again.', 'error');
                    this.loading = false;
                    return;
                }
                let data;
                try {
                    data = await response.json();
                } catch (parseErr) {
                    if (typeof window.showToast === 'function') window.showToast('Server error. Please try again.', 'error');
                    this.loading = false;
                    return;
                }

                if (data.success) {
                    if (typeof window.showToast === 'function') window.showToast('Registration successful! Please login.', 'success');
                    setTimeout(function () { window.location.href = 'login.html'; }, 1200);
                } else {
                    if (typeof window.showToast === 'function') window.showToast(data.message || 'Registration failed', 'error');
                }
            } catch (err) {
                console.error(err);
                if (typeof window.showToast === 'function') window.showToast('Server error', 'error');
            } finally {
                this.loading = false;
            }
        }
    }));

    // Navbar Dropdown Fix for Overflow Clipping
    const navDropdowns = document.querySelectorAll('nav .group');
    navDropdowns.forEach(group => {
        const button = group.querySelector('button');
        const dropdown = group.querySelector('.absolute');

        if (!button || !dropdown) return;

        const updatePosition = () => {
            const rect = button.getBoundingClientRect();
            // Force fixed positioning to escape overflow container
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${rect.bottom}px`;
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.width = '12rem'; // Standard width
            dropdown.style.zIndex = '1000'; // High z-index
        };

        // Update on hover
        group.addEventListener('mouseenter', updatePosition);

        // Update on click (for touch devices)
        button.addEventListener('click', updatePosition);

        // Handle scrolling (close or update? Sticky nav keeps button fixed, so update is fine)
        window.addEventListener('scroll', () => {
            if (!dropdown.classList.contains('hidden')) {
                updatePosition();
            }
        }, { passive: true });
    });
});
