const express = require('express');
const path = require('path');
const app = express();

// 🔒 HIDDEN GOOGLE APP SCRIPT URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx9G6idQXbdHVR3gNqFfnSrvWr5jRLUIJ9VTkiczGBVDn-y6Yr4FPGB8pYYLohnbaImWw/exec";

// Public folder ka sahi path
const publicDir = path.join(__dirname, '..', 'public');

// 🛑 1. SECURE CSS ROUTE
app.get('/style.css', (req, res) => {
    // Check: Website se request aayi hai ya direct link se?
    if (req.headers['sec-fetch-dest'] === 'style') {
        res.sendFile(path.join(publicDir, 'style.css'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// 🛑 2. SECURE JS ROUTE
app.get('/script.js', (req, res) => {
    // Check: Website se request aayi hai ya direct link se?
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(publicDir, 'script.js'));
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

// ✅ 4. RAW JSON API FETCH (TRANSACTION)
app.get('/transction=:id', async (req, res) => {
    try {
        const response = await fetch(`${GAS_API_URL}?txnid=${req.params.id}`);
        const data = await response.json();
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(data, null, 4));
    } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

// ✅ 5. RAW JSON API FETCH (UTR)
app.get('/utr=:id', async (req, res) => {
    try {
        const response = await fetch(`${GAS_API_URL}?utr=${req.params.id}`);
        const data = await response.json();
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(data, null, 4));
    } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

// ✅ 6. RAW JSON API FETCH (PURPOSE)
app.get('/purpose=:id', async (req, res) => {
    try {
        const response = await fetch(`${GAS_API_URL}?q=${req.params.id}`);
        const data = await response.json();
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(data, null, 4));
    } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

module.exports = app;
