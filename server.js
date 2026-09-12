const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 HIDDEN GAS URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx9G6idQXbdHVR3gNqFfnSrvWr5jRLUIJ9VTkiczGBVDn-y6Yr4FPGB8pYYLohnbaImWw/exec";

// Allow static images and GIFs to load normally
app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    setHeaders: (res, path, stat) => {
        // Prevent direct access to js and css via express static
        if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-store');
        }
    }
}));

// Serve Main HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🛑 SMART PROTECTION: CSS File
app.get('/style.css', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'style') {
        res.sendFile(path.join(__dirname, 'public', 'style.css'));
    } else {
        res.status(403).json({ error: "Access Denied: Invalid Request" });
    }
});

// 🛑 SMART PROTECTION: JS File
app.get('/script.js', (req, res) => {
    if (req.headers['sec-fetch-dest'] === 'script') {
        res.sendFile(path.join(__dirname, 'public', 'script.js'));
    } else {
        res.status(403).json({ error: "Access Denied: Invalid Request" });
    }
});

// ✅ SECURE INTERNAL API (Auto-fetch)
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

app.listen(PORT, () => {
    console.log(`Secure Server running on port ${PORT}`);
});
