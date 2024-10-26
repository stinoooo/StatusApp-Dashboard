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
    res.redirect('/'); // Redirect to homepage if not authenticated
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
        // Extract search filters from query parameters
        const { userid, actionType, startDate, endDate, reason } = req.query;

        // Base SQL query for fetching moderation logs
        let query = 'SELECT userid, targetid, action, reason, created FROM Moderation WHERE 1=1';
        const queryParams = [];

        // Apply filtering conditions only if filters are provided

        // Filter by User ID (moderator's ID)
        if (userid) {
            query += ' AND userid = ?';
            queryParams.push(userid);
        }

        // Filter by action type (e.g., Ban, Mute, Kick)
        if (actionType) {
            query += ' AND action = ?';
            queryParams.push(actionType);
        }

        // Filter by reason (partial match for reason text)
        if (reason) {
            query += ' AND reason LIKE ?';
            queryParams.push(`%${reason}%`);
        }

        // Filter by start date
        if (startDate) {
            query += ' AND created >= ?';
            queryParams.push(new Date(startDate));
        }

        // Filter by end date
        if (endDate) {
            query += ' AND created <= ?';
            queryParams.push(new Date(endDate));
        }

        // Sort the logs by the creation date in descending order
        query += ' ORDER BY created DESC';

        // Execute query with filters applied
        const [logs] = await db.query(query, queryParams);

        // Render dashboard page with user and log data
        res.render('dashboard', { 
            user: req.session.user, 
            logs,
            PERMISSIONS,
            filters: { userid, actionType, startDate, endDate, reason } // Pass filters back to view for display
        });
    } catch (error) {
        console.error("Error loading moderation logs:", error);
        res.status(500).send("Failed to load moderation logs");
    }
});

module.exports = router;