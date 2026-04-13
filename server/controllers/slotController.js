const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const { isSlotAvailable } = require('../utils/bookingHelpers');

// ─────────────────────────────────────────────────────────────
// @route   GET /api/slots?startTime=...&endTime=...&vehicleType=...
// @access  Private
// ─────────────────────────────────────────────────────────────
const getAllSlots = async (req, res) => {
    try {
        const { startTime, endTime, vehicleType } = req.query;

        // Build query — filter by vehicleType if provided
        const query = {};
        if (vehicleType && ['two-wheeler', 'four-wheeler'].includes(vehicleType)) {
            query.vehicleType = vehicleType;
        }

        const slots = await Slot.find(query).sort({ slotId: 1 });

        const slotsWithStatus = await Promise.all(
            slots.map(async (slot) => {
                let status = 'available';
                let bookedBy = null;

                if (startTime && endTime) {
                    const available = await isSlotAvailable(slot._id, startTime, endTime);
                    status = available ? 'available' : 'occupied';

                    if (!available) {
                        const conflict = await Booking.findOne({
                            slotId: slot._id,
                            status: 'active',
                            startTime: { $lt: new Date(endTime) },
                            endTime: { $gt: new Date(startTime) },
                        }).populate('userId', 'name email');

                        if (conflict) {
                            bookedBy = {
                                name: conflict.userId?.name,
                                email: conflict.userId?.email,
                                bookingId: conflict._id,
                                from: conflict.startTime,
                                to: conflict.endTime,
                            };
                        }
                    }
                }

                return {
                    _id: slot._id,
                    slotId: slot.slotId,
                    vehicleType: slot.vehicleType,
                    status,
                    bookedBy,
                    createdAt: slot.createdAt,
                };
            })
        );

        res.status(200).json({
            totalSlots: slots.length,
            available: slotsWithStatus.filter(s => s.status === 'available').length,
            occupied: slotsWithStatus.filter(s => s.status === 'occupied').length,
            slots: slotsWithStatus,
        });

    } catch (error) {
        console.error('Get slots error:', error.message);
        res.status(500).json({ message: 'Server error fetching slots.' });
    }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/slots/recommend
// @access  Private
// ─────────────────────────────────────────────────────────────
const recommendSlot = async (req, res) => {
    try {
        const { startTime, endTime, vehicleType } = req.query;

        const query = {};
        if (vehicleType) query.vehicleType = vehicleType;

        const slots = await Slot.find(query).sort({ slotId: 1 });

        for (const slot of slots) {
            let available = true;
            if (startTime && endTime) {
                available = await isSlotAvailable(slot._id, startTime, endTime);
            }
            if (available) {
                return res.status(200).json({
                    message: `We recommend slot ${slot.slotId}!`,
                    slot: {
                        _id: slot._id,
                        slotId: slot.slotId,
                        vehicleType: slot.vehicleType,
                        status: 'available',
                    },
                });
            }
        }

        res.status(404).json({
            message: 'No available slots for the selected vehicle type and time range.',
        });

    } catch (error) {
        console.error('Recommend slot error:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/slots
// @access  Admin only
// ─────────────────────────────────────────────────────────────
const addSlot = async (req, res) => {
    try {
        const { slotId, vehicleType } = req.body;

        if (!slotId || !vehicleType) {
            return res.status(400).json({
                message: 'Please provide both slot ID and vehicle type.',
            });
        }

        if (!['two-wheeler', 'four-wheeler'].includes(vehicleType)) {
            return res.status(400).json({
                message: 'Vehicle type must be "two-wheeler" or "four-wheeler".',
            });
        }

        const existing = await Slot.findOne({ slotId: slotId.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                message: `Slot ${slotId.toUpperCase()} already exists.`,
            });
        }

        const newSlot = await Slot.create({
            slotId: slotId.toUpperCase(),
            vehicleType,
        });

        res.status(201).json({
            message: `Slot ${newSlot.slotId} (${vehicleType}) added successfully!`,
            slot: newSlot,
        });

    } catch (error) {
        console.error('Add slot error:', error.message);
        res.status(500).json({ message: 'Server error adding slot.' });
    }
};

// ─────────────────────────────────────────────────────────────
// @route   DELETE /api/slots/:id
// @access  Admin only
// ─────────────────────────────────────────────────────────────
const deleteSlot = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found.' });
        }

        const now = new Date();
        const activeBooking = await Booking.findOne({
            slotId: slot._id,
            status: 'active',
            endTime: { $gt: now },
        });

        if (activeBooking) {
            return res.status(400).json({
                message: `Cannot delete Slot ${slot.slotId} — it has an active booking.`,
            });
        }

        await Slot.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: `Slot ${slot.slotId} deleted successfully.` });

    } catch (error) {
        console.error('Delete slot error:', error.message);
        res.status(500).json({ message: 'Server error deleting slot.' });
    }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/slots/:id/schedule
// @access  Private
// ─────────────────────────────────────────────────────────────
const getSlotSchedule = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) return res.status(404).json({ message: 'Slot not found.' });

        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Provide a date.' });

        const dayStart = new Date(`${date}T00:00:00.000Z`);
        const dayEnd = new Date(`${date}T23:59:59.999Z`);

        const bookings = await Booking.find({
            slotId: slot._id,
            status: 'active',
            startTime: { $lt: dayEnd },
            endTime: { $gt: dayStart },
        }).populate('userId', 'name');

        res.status(200).json({
            slotId: slot.slotId,
            date,
            bookings: bookings.map(b => ({
                from: b.startTime,
                to: b.endTime,
                bookedBy: b.userId?.name,
            })),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    getAllSlots,
    addSlot,
    deleteSlot,
    recommendSlot,
    getSlotSchedule,
};