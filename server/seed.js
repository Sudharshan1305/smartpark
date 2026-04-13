const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Slot = require('./models/Slot');
const Booking = require('./models/Booking');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await User.deleteMany({});
        await Slot.deleteMany({});
        await Booking.deleteMany({});
        console.log('🗑️  Cleared all collections');

        // Admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            name: 'Admin', email: 'admin@smartpark.com',
            password: hashedPassword, role: 'admin',
        });
        console.log('👤 Admin created: admin@smartpark.com / admin123');

        // Slots: A1-A6 four-wheeler, B1-B4 two-wheeler
        const slots = [
            ...['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map(id => ({ slotId: id, vehicleType: 'four-wheeler' })),
            ...['B1', 'B2', 'B3', 'B4'].map(id => ({ slotId: id, vehicleType: 'two-wheeler' })),
        ];
        await Slot.insertMany(slots);
        console.log('🅿️  10 slots created (A1-A6: four-wheeler, B1-B4: two-wheeler)');

        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedDatabase();