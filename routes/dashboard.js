// routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/');
};

// Dashboard route with authentication check
router.get('/', checkAuth, async (req, res) => {
    try {
        const [logs] = await db.query('SELECT userid, action, reason, created FROM Moderation ORDER BY created DESC');
        res.render('dashboard', { user: req.session.user, logs });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to load moderation logs");
    }
});

module.exports = router;
