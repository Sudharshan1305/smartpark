// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const authRoutes = require('./routes/authRoutes');
// const slotRoutes = require('./routes/slotRoutes');
// const bookingRoutes = require('./routes/bookingRoutes');

// const app = express();

// // ── CORS ─────────────────────────────────────────────────────
// // Allow requests from your Azure Static Web App URL
// // and localhost for development
// const allowedOrigins = [
//     'http://localhost:3000',
//     process.env.FRONTEND_URL, // Set this in Azure App Service settings
// ];

// app.use(cors({
//     origin: function (origin, callback) {
//         // Allow requests with no origin (mobile apps, Postman)
//         if (!origin) return callback(null, true);
//         if (allowedOrigins.includes(origin)) {
//             return callback(null, true);
//         }
//         return callback(new Error('Not allowed by CORS'));
//     },
//     credentials: true,
// }));

// app.use(express.json());

// // ── Routes ────────────────────────────────────────────────────
// app.use('/api/auth', authRoutes);
// app.use('/api/slots', slotRoutes);
// app.use('/api/bookings', bookingRoutes);

// // ── Health Check ──────────────────────────────────────────────
// app.get('/', (req, res) => {
//     res.json({
//         status: 'running',
//         message: 'SmartPark API ✅',
//         time: new Date().toISOString(),
//     });
// });

// // ── Connect + Start ───────────────────────────────────────────
// const PORT = process.env.PORT || 5000;

// mongoose
//     .connect(process.env.MONGO_URI)
//     .then(() => {
//         console.log('✅ MongoDB Connected');
//         app.listen(PORT, () => {
//             console.log(`🚀 Server running on port ${PORT}`);
//         });
//     })
//     .catch((err) => {
//         console.error('❌ MongoDB connection failed:', err.message);
//         process.exit(1);
//     });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ✅ needed
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// ── Serve React Build ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'client/build')));

// ── React Router fallback (VERY IMPORTANT) ────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// ── Connect + Start ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });