const express = require('express');
const path = require('path');
const app = express();

// 🔒 HIDDEN GOOGLE APP SCRIPT URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx9G6idQXbdHVR3gNqFfnSrvWr5jRLUIJ9VTkiczGBVDn-y6Yr4FPGB8pYYLohnbaImWw/exec";

// Main folder ka path (kyunki server.js ab 'api' folder mein hai)
const rootDir = path.join(__dirname, '..');

// 🛑 1. SECURE CSS ROUTE
app.get('/style.css', (req, res) => {
    // Check agar website ne CSS maanga hai (valid) ya user ne direct link open kiya hai (invalid)
    if (req.headers['sec-fetch-dest'] === 'style') {
        res.sendFile(path.join(rootDir, 'style.css'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// 🛑 2. SECURE JS ROUTE
app.get('/script.js', (req, res) => {
    // Check agar website ne JS maanga hai (valid)
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(rootDir, 'script.js'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// ✅ 3. SECURE API FETCH (Hidden backend calling Google)
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

// Vercel Serverless Function ke liye export
module.exports = app;
