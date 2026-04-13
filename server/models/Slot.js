const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
    {
        slotId: {
            type: String,
            required: [true, 'Slot ID is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        vehicleType: {
            type: String,
            enum: ['two-wheeler', 'four-wheeler'],
            required: [true, 'Vehicle type is required'],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Slot', slotSchema);