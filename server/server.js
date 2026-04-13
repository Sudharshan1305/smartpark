require('dotenv').config();

console.log("JWT SECRET (server):", process.env.JWT_SECRET);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json()); // Parse incoming JSON requests

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// ─── Health Check Route ───────────────────────────────────────
app.get('/', (req, res) => {
    res.send('SmartPark API is running ✅');
});

// ─── Connect to MongoDB & Start Server ───────────────────────
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    });