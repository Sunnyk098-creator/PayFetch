const express = require('express');
const path = require('path');
const app = express();

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx9G6idQXbdHVR3gNqFfnSrvWr5jRLUIJ9VTkiczGBVDn-y6Yr4FPGB8pYYLohnbaImWw/exec";
const PAYZY_TOKEN = "RP-M-4EB56C18655EEB33CBDF468A";

const rootDir = process.cwd();

// 🛑 1. SECURE CSS ROUTE
app.get('/style.css', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'style') {
        res.sendFile(path.join(rootDir, 'public', 'style.css'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// 🛑 2. SECURE JS ROUTE
app.get('/script.js', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(rootDir, 'public', 'script.js'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// ✅ 3. SECURE API FETCH (UPI)
app.get('/api/fetch', async (req, res) => {
    const { note } = req.query;
    if (!note) return res.status(400).json({ error: "invalid parameters" });
    try {
        const response = await fetch(`${GAS_API_URL}?q=${note}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

// ✅ 4. SECURE API FETCH (PAYZY CREATE)
app.get('/api/payzy/create', async (req, res) => {
    const { amount, order_id } = req.query;
    if (!amount || !order_id) return res.status(400).json({ error: "invalid parameters" });
    try {
        const response = await fetch(`https://payzy-gateway.site/api/deposit/create?token=${PAYZY_TOKEN}&amount=${amount}&order_id=${order_id}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

// ✅ 5. SECURE API FETCH (PAYZY STATUS)
app.get('/api/payzy/status', async (req, res) => {
    const { invoice_id } = req.query;
    if (!invoice_id) return res.status(400).json({ error: "invalid parameters" });
    try {
        const response = await fetch(`https://payzy-gateway.site/api/status/${invoice_id}?token=${PAYZY_TOKEN}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
});

module.exports = app;
