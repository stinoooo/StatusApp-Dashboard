// routes/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { PERMISSIONS, hasPermission } = require('../utils/permissions');
require('dotenv').config();

// Redirect to Discord OAuth
router.get('/discord', (req, res) => {
    const redirectUri = `https://discord.com/oauth2/authorize?client_id=1299719074581975141&response_type=code&redirect_uri=https%3A%2F%2Fstatus-dashboard.up.railway.app%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds+email+applications.commands.permissions.update`;
    res.redirect(redirectUri);
});

// Callback after Discord OAuth
router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

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
            return res.status(403).render('unauthorized', { message: "User is not part of the required guild." });
        }

        // Fetch member info for permissions
        const memberResponse = await axios.get(`https://discord.com/api/guilds/${targetGuild.id}/members/${userResponse.data.id}`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        });

        const permissions = BigInt(memberResponse.data.permissions);

        // Check if user has MODERATE_MEMBERS permission for access
        if (!hasPermission(permissions, PERMISSIONS.MODERATE_MEMBERS)) {
            return res.status(403).render('unauthorized', { message: "You do not have permission to access this dashboard." });
        }

        // Store user data and permissions for frontend feature access
        req.session.user = {
            ...userResponse.data,
            permissions,
        };
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Authentication failed");
    }
});

module.exports = router;