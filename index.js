const express = require('express');
const path = require('path');
const app = express();

// 🔒 HIDDEN GOOGLE APP SCRIPT URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx9G6idQXbdHVR3gNqFfnSrvWr5jRLUIJ9VTkiczGBVDn-y6Yr4FPGB8pYYLohnbaImWw/exec";

// Public folder ka path jahan aapki HTML, CSS, JS aur GIFs hain
const publicDir = path.join(process.cwd(), 'public');

// 🛑 1. SECURE CSS ROUTE
app.get('/style.css', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'style') {
        res.sendFile(path.join(publicDir, 'style.css'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// 🛑 2. SECURE JS ROUTE
app.get('/script.js', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(publicDir, 'script.js'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// ✅ 3. SECURE API FETCH
app.get('/api/fetch', async (req, res) => {
    const { note } = req.query;
    if (!note) return res.status(400).json({ error: "invalid parameters" });

    try {
        const response = await fetch(`${GAS_API_URL}?q=${note}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ 4. SERVE HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// ✅ 5. SERVE ALL OTHER FILES (GIFs, Logos, etc.)
app.use(express.static(publicDir));

// Vercel Serverless ke liye export zaroori hai (app.listen nahi lagana)
module.exports = app;
