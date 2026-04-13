const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,               // Removes extra spaces
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,             // No two users can have same email
            lowercase: true,          // Stores email in lowercase always
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },
        role: {
            type: String,
            enum: ['user', 'admin'],  // Only these two values allowed
            default: 'user',          // New registrations are always "user"
        },
    },
    {
        timestamps: true,           // Adds createdAt and updatedAt automatically
    }
);

module.exports = mongoose.model('User', userSchema);