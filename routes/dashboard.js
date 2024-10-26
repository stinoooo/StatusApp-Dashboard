// routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { PERMISSIONS, hasPermission } = require('../utils/permissions');

// Middleware to check if user is authenticated
const checkAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/auth/discord');
};

// Middleware to check if user has VIEW_AUDIT_LOG permission
const checkAuditLogPermission = (req, res, next) => {
    if (hasPermission(req.session.user.permissions, PERMISSIONS.VIEW_AUDIT_LOG)) {
        return next();
    }
    res.status(403).render('unauthorized', { message: "You do not have permission to view the dashboard logs." });
};

// Dashboard route with authentication and permissions check
router.get('/', checkAuth, checkAuditLogPermission, async (req, res) => {
    try {
        // Fetch recent moderation logs from the database
        const [logs] = await db.query('SELECT userid, action, reason, created FROM Moderation ORDER BY created DESC');

        // Render dashboard page with user and log data
        res.render('dashboard', { 
            user: req.session.user, 
            logs,
            PERMISSIONS
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to load moderation logs");
    }
});

module.exports = router;