const mongoose = require('mongoose');

const classTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'نام کلاس الزامی است.'],
        trim: true,
        unique: true
    },
    price: {
        type: Number,
        required: [true, 'قیمت کلاس الزامی است.'],
        min: 0
    },
    termsAndConditions: {
        type: String,
        required: [true, 'قوانین و مقررات الزامی است.'],
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ClassType', classTypeSchema);