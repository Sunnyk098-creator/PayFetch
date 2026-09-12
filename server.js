const express = require('express');
const path = require('path');
const app = express();

// 🔒 HIDDEN GOOGLE APP SCRIPT URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx9G6idQXbdHVR3gNqFfnSrvWr5jRLUIJ9VTkiczGBVDn-y6Yr4FPGB8pYYLohnbaImWw/exec";

// ✅ 1. SERVE MAIN HTML (Fixes the 404 / error)
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// 🛑 2. SECURE CSS ROUTE
app.get('/style.css', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'style') {
        res.sendFile(path.join(process.cwd(), 'style.css'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// 🛑 3. SECURE JS ROUTE
app.get('/script.js', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(process.cwd(), 'script.js'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// ✅ 4. SECURE API FETCH (Hidden backend calling Google)
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

// ✅ 5. SERVE ALL OTHER FILES (GIFs, JPGs) NORMALLY
app.use(express.static(process.cwd()));

// Vercel Serverless Function ke liye export
module.exports = app;
