const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { isSlotAvailable } = require('../utils/bookingHelpers');

const expireOldBookings = async () => {
    try {
        const result = await Booking.updateMany(
            { status: 'active', endTime: { $lt: new Date() } },
            { $set: { status: 'expired' } }
        );
        if (result.modifiedCount > 0) {
            console.log(`⏰ ${result.modifiedCount} booking(s) auto-expired.`);
        }
    } catch (err) {
        console.error('Expire error:', err.message);
    }
};

// ─────────────────────────────────────────────
// @route   POST /api/bookings
// @access  Private
// ─────────────────────────────────────────────
const createBooking = async (req, res) => {
    try {
        await expireOldBookings();

        const { slotId, startTime, endTime, vehicleType } = req.body;
        const userId = req.user.id;

        // 1. Validate all fields
        if (!slotId || !startTime || !endTime || !vehicleType) {
            return res.status(400).json({
                message: 'Please provide slotId, startTime, endTime, and vehicleType.',
            });
        }

        if (!['two-wheeler', 'four-wheeler'].includes(vehicleType)) {
            return res.status(400).json({
                message: 'Vehicle type must be "two-wheeler" or "four-wheeler".',
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date/time format.' });
        }

        if (end <= start) {
            return res.status(400).json({
                message: 'End time must be after start time.',
            });
        }

        if ((end - start) / (1000 * 60 * 60) > 24) {
            return res.status(400).json({
                message: 'Maximum booking duration is 24 hours.',
            });
        }

        // 2. Slot must exist and match vehicle type
        const slot = await Slot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found.' });
        }

        if (slot.vehicleType !== vehicleType) {
            return res.status(400).json({
                message: `Slot ${slot.slotId} is for ${slot.vehicleType} only.`,
            });
        }

        // 3. Check for time overlap
        const available = await isSlotAvailable(slot._id, start, end);
        if (!available) {
            const conflict = await Booking.findOne({
                slotId: slot._id,
                status: 'active',
                startTime: { $lt: end },
                endTime: { $gt: start },
            });

            const from = conflict
                ? new Date(conflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            const to = conflict
                ? new Date(conflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

            return res.status(400).json({
                message: `Slot ${slot.slotId} is already booked from ${from} to ${to}. Please choose a different time.`,
            });
        }

        // 4. Create booking using new + save() to trigger pre-save hook
        const newBooking = new Booking({
            userId,
            slotId: slot._id,
            vehicleType,
            startTime: start,
            endTime: end,
            status: 'active',
        });

        await newBooking.save();

        const populated = await Booking.findById(newBooking._id)
            .populate('slotId', 'slotId vehicleType')
            .populate('userId', 'name email');

        console.log('✅ Booking saved:', newBooking._id, '| Receipt:', newBooking.receiptId);

        res.status(201).json({
            message: `Slot ${slot.slotId} booked successfully!`,
            booking: populated,
        });

    } catch (error) {
        console.error('Create booking error:', error.message);
        res.status(500).json({ message: 'Server error creating booking.' });
    }
};

// ─────────────────────────────────────────────
// @route   GET /api/bookings/my
// @access  Private
// ─────────────────────────────────────────────
const getMyBookings = async (req, res) => {
    try {
        await expireOldBookings();

        const bookings = await Booking.find({ userId: req.user.id })
            .populate('slotId', 'slotId vehicleType')
            .populate('userId', 'name email')
            .sort({ startTime: -1 });

        res.status(200).json({
            totalBookings: bookings.length,
            activeBookings: bookings.filter(b => b.status === 'active'),
            pastBookings: bookings.filter(b => b.status !== 'active'),
        });

    } catch (error) {
        console.error('Get my bookings error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─────────────────────────────────────────────
// @route   PUT /api/bookings/cancel/:id
// @access  Private
// ─────────────────────────────────────────────
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: 'Booking not found.' });
        if (booking.userId.toString() !== req.user.id)
            return res.status(403).json({ message: 'You can only cancel your own bookings.' });
        if (booking.status !== 'active')
            return res.status(400).json({ message: `Booking is already ${booking.status}.` });

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({
            message: 'Booking cancelled. The slot is now free for that time.',
            booking,
        });
    } catch (error) {
        console.error('Cancel booking error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─────────────────────────────────────────────
// @route   GET /api/bookings/receipt/:id
// @access  Private (owner only)
// ─────────────────────────────────────────────
const getBookingReceipt = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('slotId', 'slotId vehicleType')
            .populate('userId', 'name email');

        if (!booking) return res.status(404).json({ message: 'Booking not found.' });
        if (booking.userId._id.toString() !== req.user.id)
            return res.status(403).json({ message: 'Access denied.' });

        const durationHours = parseFloat(
            ((new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60)).toFixed(2)
        );

        res.status(200).json({
            receipt: {
                receiptId: booking.receiptId,
                bookingId: booking._id,
                userName: booking.userId.name,
                userEmail: booking.userId.email,
                slotId: booking.slotId.slotId,
                vehicleType: booking.vehicleType,
                startTime: booking.startTime,
                endTime: booking.endTime,
                durationHours,
                status: booking.status,
                bookedOn: booking.createdAt,
            },
        });
    } catch (error) {
        console.error('Receipt error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─────────────────────────────────────────────
// @route   GET /api/bookings/public/:id
// @desc    Public route — QR code scan page data
// @access  PUBLIC (no auth needed)
// ─────────────────────────────────────────────
const getPublicBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('slotId', 'slotId vehicleType')
            .populate('userId', 'name');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const durationHours = parseFloat(
            ((new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60)).toFixed(2)
        );

        res.status(200).json({
            bookingId: booking._id,
            receiptId: booking.receiptId,
            userName: booking.userId?.name || 'Unknown',
            slotId: booking.slotId?.slotId || 'Unknown',
            vehicleType: booking.vehicleType,
            startTime: booking.startTime,
            endTime: booking.endTime,
            durationHours,
            status: booking.status,
            bookedOn: booking.createdAt,
        });
    } catch (error) {
        console.error('Public booking error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─────────────────────────────────────────────
// @route   GET /api/bookings/all
// @access  Admin only
// ─────────────────────────────────────────────
const getAllBookings = async (req, res) => {
    try {
        await expireOldBookings();

        const bookings = await Booking.find()
            .populate('slotId', 'slotId vehicleType')
            .populate('userId', 'name email')
            .sort({ startTime: -1 });

        const safeBookings = bookings.map(b => ({
            _id: b._id,
            receiptId: b.receiptId,
            status: b.status,
            vehicleType: b.vehicleType,
            startTime: b.startTime,
            endTime: b.endTime,
            createdAt: b.createdAt,
            slotId: b.slotId ? { slotId: b.slotId.slotId, vehicleType: b.slotId.vehicleType } : null,
            userId: b.userId ? { name: b.userId.name, email: b.userId.email } : null,
        }));

        res.status(200).json({ totalBookings: safeBookings.length, bookings: safeBookings });
    } catch (error) {
        console.error('Get all bookings error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/bookings/:id
// @access  Admin only
// ─────────────────────────────────────────────
const adminDeleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Booking deleted successfully.' });
    } catch (error) {
        console.error('Delete booking error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─────────────────────────────────────────────
// @route   GET /api/bookings/analytics
// @access  Admin only
// ─────────────────────────────────────────────
const getAnalytics = async (req, res) => {
    try {
        const allBookings = await Booking.find();
        const allSlots = await Slot.find();
        const now = new Date();

        const totalBookings = allBookings.length;
        const activeBookings = allBookings.filter(b => b.status === 'active').length;
        const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
        const expiredBookings = allBookings.filter(b => b.status === 'expired').length;
        const totalSlots = allSlots.length;

        // Vehicle type breakdown
        const twoWheelerBookings = allBookings.filter(b => b.vehicleType === 'two-wheeler').length;
        const fourWheelerBookings = allBookings.filter(b => b.vehicleType === 'four-wheeler').length;

        let currentlyOccupied = 0;
        for (const slot of allSlots) {
            const active = await Booking.findOne({
                slotId: slot._id,
                status: 'active',
                startTime: { $lt: now },
                endTime: { $gt: now },
            });
            if (active) currentlyOccupied++;
        }

        const hourCounts = Array(24).fill(0);
        allBookings.forEach(b => {
            hourCounts[new Date(b.startTime).getHours()]++;
        });

        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const peakHourFormatted =
            peakHour === 0 ? '12:00 AM'
                : peakHour < 12 ? `${peakHour}:00 AM`
                    : peakHour === 12 ? '12:00 PM'
                        : `${peakHour - 12}:00 PM`;

        const bookingsPerHour = hourCounts.map((count, hour) => ({
            hour: `${hour}:00`, bookings: count,
        }));

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = allBookings.filter(
                b => new Date(b.createdAt).toISOString().split('T')[0] === dateStr
            ).length;
            last7Days.push({ date: dateStr, bookings: count });
        }

        res.status(200).json({
            overview: {
                totalBookings,
                activeBookings,
                cancelledBookings,
                expiredBookings,
                totalSlots,
                occupiedSlots: currentlyOccupied,
                availableSlots: totalSlots - currentlyOccupied,
                peakHour: peakHourFormatted,
                peakHourRaw: peakHour,
                twoWheelerBookings,
                fourWheelerBookings,
            },
            bookingsPerHour,
            last7Days,
        });
    } catch (error) {
        console.error('Analytics error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    cancelBooking,
    getBookingReceipt,
    getPublicBooking,
    getAllBookings,
    adminDeleteBooking,
    getAnalytics,
};