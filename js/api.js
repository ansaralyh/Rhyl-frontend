// API Configuration
const API_BASE_URL = 'https://rhyl-backend-1t8dk3gij-ansaralyhs-projects.vercel.app/api';

// Get auth token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Set auth token in localStorage
const setToken = (token) => {
    localStorage.setItem('token', token);
};

// Remove auth token from localStorage
const removeToken = () => {
    localStorage.removeItem('token');
};

// Get current user from localStorage
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Set current user in localStorage
const setCurrentUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

// Remove current user from localStorage
const removeCurrentUser = () => {
    localStorage.removeItem('user');
};

// HTTP request wrapper
const request = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// API Methods
const api = {
    // Authentication
    auth: {
        signup: async (userData) => {
            const data = await request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            if (data.success) {
                setToken(data.data.token);
                setCurrentUser(data.data);
            }
            return data;
        },

        login: async (credentials) => {
            const data = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            if (data.success) {
                setToken(data.data.token);
                setCurrentUser(data.data);
            }
            return data;
        },

        logout: () => {
            removeToken();
            removeCurrentUser();
            window.location.href = 'index.html';
        },

        getMe: async () => {
            return await request('/auth/me');
        },

        updateProfile: async (profileData) => {
            return await request('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        }
    },

    // Products
    products: {
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await request(`/products?${queryString}`);
        },

        getById: async (id) => {
            return await request(`/products/${id}`);
        },

        create: async (productData) => {
            return await request('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        },

        update: async (id, productData) => {
            return await request(`/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        },

        delete: async (id) => {
            return await request(`/products/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Cart
    cart: {
        get: async () => {
            return await request('/cart');
        },

        add: async (productId, quantity = 1) => {
            return await request('/cart/add', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity })
            });
        },

        update: async (productId, quantity) => {
            return await request(`/cart/update/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });
        },

        remove: async (productId) => {
            return await request(`/cart/remove/${productId}`, {
                method: 'DELETE'
            });
        },

        clear: async () => {
            return await request('/cart/clear', {
                method: 'DELETE'
            });
        }
    },

    // Orders
    orders: {
        getAll: async () => {
            return await request('/orders');
        },

        getById: async (id) => {
            return await request(`/orders/${id}`);
        },

        create: async (orderData) => {
            return await request('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
        },

        getAllAdmin: async () => {
            return await request('/orders/admin/all');
        },

        updateStatus: async (id, statusData) => {
            return await request(`/orders/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify(statusData)
            });
        }
    },

    // Admin
    admin: {
        getDashboard: async () => {
            return await request('/admin/dashboard');
        },

        getUsers: async () => {
            return await request('/admin/users');
        },

        updateUserRole: async (userId, role) => {
            return await request(`/admin/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role })
            });
        },

        getAnalytics: async (period = '30') => {
            return await request(`/admin/analytics?period=${period}`);
        }
    }
};

// Export for use in other files
window.api = api;
window.getToken = getToken;
window.getCurrentUser = getCurrentUser;
