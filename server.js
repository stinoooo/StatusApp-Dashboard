// server.js
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const db = require('./config/db');
const path = require('path');

dotenv.config(); // Load environment variables
const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to handle JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Redis client with Railway's REDIS_URL
const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis connection error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Connect to Redis
redisClient.connect().catch(console.error);

// Configure session with Redis store
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET, // Pulls SESSION_SECRET from environment variables
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Secure cookies in production
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Root route - checks if user is authenticated, then redirects or renders index
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard'); // Redirect authenticated users to dashboard
    } else {
        res.render('index'); // Render the landing page for unauthenticated users
    }
});

// Routes for authentication and dashboard
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Handle unauthorized access to /dashboard and redirect to home
app.use((req, res, next) => {
    if (!req.session.user && req.path.startsWith('/dashboard')) {
        return res.redirect('/'); // Redirect to landing if trying to access restricted routes
    }
    next();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});