const mongoose = require('mongoose');
const { Schema } = mongoose;

const consultationRequestSchema = new Schema({
    name: {
        type: String,
        required: [true, 'نام الزامی است.'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: [true, 'شماره موبایل الزامی است.'],
        trim: true
    },
    sourceUrl: { // آدرس صفحه‌ای که کاربر از آنجا فرم را پر کرده
        type: String,
        trim: true
    },
    status: { // برای پیگیری در پنل ادمین
        type: String,
        enum: ['New', 'Contacted', 'Closed'],
        default: 'New'
    }
}, { timestamps: true });

const ConsultationRequest = mongoose.model('ConsultationRequest', consultationRequestSchema);
module.exports = ConsultationRequest;