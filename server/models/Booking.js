const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        slotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Slot',
            required: true,
        },
        vehicleType: {
            type: String,
            enum: ['two-wheeler', 'four-wheeler'],
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired'],
            default: 'active',
        },
        receiptId: {
            type: String,
        },
    },
    { timestamps: true }
);

// ── Auto-generate receipt ID before saving ────────────────────
bookingSchema.pre('save', function (next) {
    if (!this.receiptId) {
        this.receiptId =
            'SP-' +
            Date.now() +
            '-' +
            Math.random().toString(36).substring(2, 5).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);