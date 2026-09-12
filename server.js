const express = require('express');
const path = require('path');
const app = express();

// 🔒 HIDDEN GOOGLE APP SCRIPT URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx9G6idQXbdHVR3gNqFfnSrvWr5jRLUIJ9VTkiczGBVDn-y6Yr4FPGB8pYYLohnbaImWw/exec";

// 🛑 1. SECURE ROUTE FOR CSS
app.get('/style.css', (req, res) => {
    // Check agar website ne CSS maanga hai ya user ne direct link open kiya hai
    if (req.headers['sec-fetch-dest'] === 'style') {
        res.sendFile(path.join(__dirname, 'style.css'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// 🛑 2. SECURE ROUTE FOR MAIN SCRIPT
app.get('/script.js', (req, res) => {
    // Check agar website ne JS maanga hai ya user ne direct link open kiya hai
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(__dirname, 'script.js'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// 🛑 3. SECURE ROUTE FOR API.JS (If exists)
app.get('/api.js', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(__dirname, 'api.js'));
    } else {
        res.status(400).json({ error: "invalid parameters" });
    }
});

// ✅ 4. REAL API FETCH (Ye normal kaam karega frontend ke liye)
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

// ✅ 5. SERVE MAIN HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ 6. SERVE ALL OTHER FILES NORMALLY (GIFs, JPGs, etc.)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running securely on port ${PORT}`);
});
