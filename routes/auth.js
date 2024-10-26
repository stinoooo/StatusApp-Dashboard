// routes/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Redirect to Discord OAuth
router.get('/discord', (req, res) => {
    const redirectUri = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`;
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

        // Fetch user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        // Fetch the user’s guilds to find their role permissions
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const targetGuild = guildsResponse.data.find(guild => guild.id === process.env.GUILD_ID);
        if (!targetGuild) {
            return res.status(403).send("User is not part of the required guild.");
        }

        // Fetch specific guild member info for permissions
        const memberResponse = await axios.get(`https://discord.com/api/guilds/${targetGuild.id}/members/${userResponse.data.id}`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        });

        const permissions = memberResponse.data.permissions;

        // Discord permissions are in bitwise format; here are the bits for MODERATE_MEMBERS and ADMIN
        const MODERATE_MEMBERS = 1 << 40;
        const ADMINISTRATOR = 1 << 3;

        const hasPermission = (permissions & MODERATE_MEMBERS) || (permissions & ADMINISTRATOR);
        if (!hasPermission) {
            return res.status(403).send("You do not have permission to access this dashboard.");
        }

        req.session.user = userResponse.data; // Store user data in session
        res.send(`Welcome, ${userResponse.data.username}!`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Authentication failed");
    }
});

module.exports = router;
