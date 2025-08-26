const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    expiresAt: {
        type: Date,
    },
    usageLimit: {
        type: Number,
        default: 1, // محدودیت استفاده
    },
    timesUsed: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Discount', discountSchema);