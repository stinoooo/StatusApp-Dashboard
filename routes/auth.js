// routes/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { PERMISSIONS, hasPermission } = require('../utils/permissions');
require('dotenv').config();

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/'); // Redirect to homepage if not authenticated
}

// Route to redirect to the Discord OAuth URL
router.get('/discord', (req, res) => {
    const discordOAuthURL = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify guilds email applications.commands.permissions.update&prompt=none`;
    res.redirect(discordOAuthURL);
});

// Callback handling for OAuth2
router.get('/', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.render('unauthorized', { message: "No code provided from Discord authorization." });

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = tokenResponse.data;

        // Fetch user info and guild permissions
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const targetGuild = guildsResponse.data.find(guild => guild.id === process.env.GUILD_ID);
        if (!targetGuild) {
            return res.render('unauthorized', { message: "User is not part of the required guild." });
        }

        const memberResponse = await axios.get(`https://discord.com/api/guilds/${targetGuild.id}/members/${userResponse.data.id}`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        });

        const permissions = BigInt(memberResponse.data.permissions);

        // Check if user has MODERATE_MEMBERS permission
        if (!hasPermission(permissions, PERMISSIONS.MODERATE_MEMBERS)) {
            return res.render('unauthorized', { message: "You do not have permission to access this dashboard." });
        }

        // Store user data in session after successful login
        req.session.user = {
            ...userResponse.data,
            permissions,
        };
        res.redirect('/dashboard');
    } catch (error) {
        console.error("Authentication failed:", error.message);
        res.render('unauthorized', { message: "Authentication failed. Please try again or contact support." });
    }
});

module.exports = { router, isAuthenticated };