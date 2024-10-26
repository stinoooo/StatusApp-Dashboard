// server.js
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const RedisStore = require('connect-redis').default; // Updated to use the `default` export
const { createClient } = require('redis');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const db = require('./config/db');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to handle JSON data
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

// Session configuration using Redis store
app.use(session({
    store: new RedisStore({ client: redisClient }),  // Updated session store configuration
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Redirect root to login page
app.get('/', (req, res) => {
    res.redirect('/auth/discord');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});