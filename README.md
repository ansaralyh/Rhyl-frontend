# Rhyl Super Store - E-Commerce Platform

A full-stack e-commerce web application for grocery and household essentials, featuring a modern frontend and robust backend API.

## 🌟 Features

### Customer Features
- **Product Browsing**: Browse products by categories (Grocery, Dairy, Beverages, etc.)
- **Search & Filter**: Search products and filter by category, price, and ratings
- **Shopping Cart**: Add/remove items, update quantities
- **Wishlist**: Save favorite products
- **User Authentication**: Secure signup and login
- **Order Management**: Place orders and track order history
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Admin Features
- **Dashboard**: View sales statistics, recent orders, and analytics
- **Product Management**: Create, edit, and delete products
- **Category Management**: Manage product categories
- **Order Management**: View and update order statuses
- **User Management**: View users and manage roles
- **Analytics**: Sales reports and top-selling products

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Structure
- **CSS3** (Tailwind CSS) - Styling
- **JavaScript** (Alpine.js) - Interactivity
- **Lucide Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher) - [Installation Guide](backend/MONGODB_SETUP.md)
- **npm** or **yarn**
- Modern web browser

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Rhyl-store
```

### 2. Set Up MongoDB
Follow the [MongoDB Setup Guide](backend/MONGODB_SETUP.md) to install MongoDB locally or use MongoDB Atlas (cloud).

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rhyl-store
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

Seed the database with initial data:
```bash
node seed.js
```

Start the backend server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### 4. Frontend Setup
Open `index.html` in your browser or use a local server:

**Using VS Code Live Server:**
1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Then visit http://localhost:8000
```

**Using Node.js http-server:**
```bash
npx http-server -p 8000
```

## 👤 Default Credentials

After running the seed script, you can login with:

**Admin Account:**
- Email: `admin@rhylstore.com`
- Password: `admin123`

**Customer Account:**
- Email: `customer@test.com`
- Password: `customer123`

## 📁 Project Structure

```
Rhyl-store/
├── backend/                 # Backend API
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & admin middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── .env                # Environment variables
│   ├── server.js           # Main server file
│   ├── seed.js             # Database seeder
│   └── README.md           # Backend documentation
├── css/                    # Stylesheets
│   └── style.css
├── js/                     # JavaScript files
│   ├── main.js             # Main app logic
│   └── api.js              # API client
├── images/                 # Product images
├── index.html              # Homepage
├── login.html              # Login page
├── signup.html             # Signup page
├── admin.html              # Admin dashboard
└── README.md               # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:productId` - Update quantity
- `DELETE /api/cart/remove/:productId` - Remove item
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update status (Admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/analytics` - Sales analytics

For detailed API documentation, see [Backend README](backend/README.md)

## 🎨 Features in Detail

### Product Categories
- Fresh Produce
- Grocery & Staples
- Spices & Masala
- Dairy Products
- Meat & Frozen Foods
- Packaged & Canned Foods
- Snacks & Bakery
- Beverages
- Household & Cleaning
- Personal Care
- Baby Care
- Pakistani Products
- Indian Products
- African Products

### Shopping Experience
- **Hero Banner**: Rotating promotional banners
- **Featured Products**: Highlighted products with special offers
- **Category Navigation**: Easy browsing by category
- **Product Cards**: Detailed product information with ratings
- **Quick Add to Cart**: One-click add to cart
- **Wishlist**: Save products for later
- **Responsive Design**: Mobile-friendly interface

### Admin Dashboard
- **Sales Overview**: Total sales, orders, products, customers
- **Recent Orders**: Latest order list with status
- **Low Stock Alerts**: Products running low on inventory
- **Analytics Charts**: Sales trends and top products
- **User Management**: View and manage customer accounts
- **Product Management**: Full CRUD operations

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and customer roles
- **Rate Limiting**: API request limiting
- **CORS Protection**: Configured CORS policy
- **Secure Headers**: Helmet.js security headers
- **Input Validation**: Mongoose schema validation

## 🧪 Testing

### Test the Backend
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rhylstore.com","password":"admin123"}'

# Get products
curl http://localhost:5000/api/products
```

### Test the Frontend
1. Open `index.html` in your browser
2. Browse products
3. Add items to cart
4. Login with test credentials
5. Access admin panel at `admin.html`

## 📝 Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with nodemon for auto-reload
```

### Adding New Products
1. Login as admin
2. Go to admin panel
3. Navigate to Products section
4. Click "Add New Product"
5. Fill in product details
6. Submit

### Adding New Categories
Categories can be added via the database or by modifying the seed script.

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` configuration
- Ensure port 5000 is available

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check browser console for errors
- Ensure CORS is properly configured

### MongoDB connection error
- See [MongoDB Setup Guide](backend/MONGODB_SETUP.md)
- Verify connection string in `.env`
- Check MongoDB service status

### Login not working
- Ensure backend is running
- Check browser console for errors
- Verify credentials are correct
- Clear browser cache and try again

## 🚀 Deployment

### Backend Deployment (Heroku, Railway, Render)
1. Set environment variables
2. Update MongoDB URI to production database
3. Set NODE_ENV to 'production'
4. Deploy backend code

### Frontend Deployment (Netlify, Vercel, GitHub Pages)
1. Update API_BASE_URL in `js/api.js` to production backend URL
2. Deploy frontend files
3. Configure CORS on backend to allow frontend domain

## 📄 License

ISC

## 👥 Contributors

- Your Name

## 🙏 Acknowledgments

- Tailwind CSS for styling framework
- Alpine.js for reactive components
- Lucide for beautiful icons
- MongoDB for database
- Express.js for backend framework

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@rhylstore.com

---

**Happy Shopping! 🛒**
