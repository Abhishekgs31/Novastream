// backend-gateway/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const JWT_SECRET = "super_secret_nova_key_2026"; 
const RedisCache = new Map();

// ---------------------------------------------------------
// 1. EDGE SECURITY: Anti-Scraping WAF (Rate Limiter)
// ---------------------------------------------------------
const requestCounts = new Map();

const edgeRateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const currentTime = Date.now();
    const windowMs = 10000; // 10 seconds
    const maxRequests = 15; // Max 15 requests per 10 seconds

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, startTime: currentTime });
    } else {
        let record = requestCounts.get(ip);
        if (currentTime - record.startTime < windowMs) {
            record.count++;
            if (record.count > maxRequests) {
                console.warn(`🚨 EDGE BLOCK: Scraping detected from IP ${ip}`);
                return res.status(429).json({ error: "Too Many Requests - Suspicious scraping activity blocked." });
            }
        } else {
            record.count = 1;
            record.startTime = currentTime;
        }
    }
    next();
};

app.use(edgeRateLimiter);

// ---------------------------------------------------------
// 2. ZERO-TRUST: Device-Bound JWT Middleware
// ---------------------------------------------------------
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    const clientFingerprint = req.headers['x-device-fingerprint'];

    if (!token || !clientFingerprint) return res.status(401).json({ error: "Unauthorized: Missing Token or Fingerprint" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.fingerprint !== clientFingerprint) {
            console.error("🛑 SECURITY ALERT: Token hijacked! Fingerprint mismatch.");
            return res.status(403).json({ error: "Forbidden: Hardware Binding Failed" });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Forbidden: Invalid or Expired Token" });
    }
};

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------

// Auth Login
app.post('/api/auth/login', (req, res) => {
    const { userId, fingerprint } = req.body;
    const token = jwt.sign({ userId, fingerprint }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// A/B Testing Cache
app.get('/api/ab-test', (req, res) => {
    const userId = req.query.userId;
    if (RedisCache.has(userId)) return res.status(200).json({ variant: RedisCache.get(userId) });
    
    const assignedVariant = Math.random() > 0.5 ? 'A' : 'B';
    RedisCache.set(userId, assignedVariant);
    res.status(200).json({ variant: assignedVariant });
});

// Mock Database
const mockMovies = [
    { id: 101, title: "Cyber Heist", genre: "Action", match: "98%" },
    { id: 102, title: "The Quantum Enigma", genre: "Sci-Fi", match: "95%" },
    { id: 103, title: "Midnight Protocol", genre: "Thriller", match: "89%" },
    { id: 104, title: "Neural Net", genre: "Documentary", match: "85%" }
];

// Protected Movie Route
app.get('/api/movies', requireAuth, (req, res) => {
    res.status(200).json(mockMovies);
});

// ---------------------------------------------------------
// 3. AI MICROSERVICE PROXY
// ---------------------------------------------------------
app.post('/api/ai-recommendations', requireAuth, async (req, res) => {
    try {
        const { userId, deviceType, timeOfDay, hoverTimeMs } = req.body;

        const aiResponse = await fetch('http://ai-service:8000/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                device_type: deviceType,
                time_of_day: timeOfDay,
                hover_time_ms: hoverTimeMs
            })
        });

        if (!aiResponse.ok) throw new Error("AI Service unreachable");

        const aiData = await aiResponse.json();
        res.status(200).json(aiData);

    } catch (error) {
        console.error("AI Proxy Error:", error);
        res.status(500).json({ error: "Failed to fetch AI recommendations" });
    }
});

app.listen(PORT, () => {
    console.log(`🛡️ Secure Backend Gateway running on http://localhost:${PORT}`);
});