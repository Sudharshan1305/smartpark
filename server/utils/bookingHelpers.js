const Booking = require('../models/Booking');

const isSlotAvailable = async (slotId, startTime, endTime, excludeBookingId = null) => {
    const query = {
        slotId,
        status: 'active',
        startTime: { $lt: new Date(endTime) },
        endTime: { $gt: new Date(startTime) },
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const overlap = await Booking.findOne(query);
    return overlap === null;
};

module.exports = { isSlotAvailable };