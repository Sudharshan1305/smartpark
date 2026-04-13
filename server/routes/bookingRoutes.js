const express = require('express');
const router = express.Router();

const {
    createBooking,
    getMyBookings,
    cancelBooking,
    getBookingReceipt,
    getPublicBooking,
    getAllBookings,
    adminDeleteBooking,
    getAnalytics,
} = require('../controllers/bookingController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ── PUBLIC (no auth — for QR scan) ───────────────────────────
router.get('/public/:id', getPublicBooking);

// ── User Routes ───────────────────────────────────────────────
router.post('/', authMiddleware, createBooking);
router.get('/my', authMiddleware, getMyBookings);
router.put('/cancel/:id', authMiddleware, cancelBooking);
router.get('/receipt/:id', authMiddleware, getBookingReceipt);

// ── Admin Routes ──────────────────────────────────────────────
router.get('/all', authMiddleware, roleMiddleware, getAllBookings);
router.get('/analytics', authMiddleware, roleMiddleware, getAnalytics);
router.delete('/:id', authMiddleware, roleMiddleware, adminDeleteBooking);

module.exports = router;