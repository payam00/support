const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    mobileNumber: {
        type: String,
        required: [true, 'شماره موبایل الزامی است.'],
        unique: true,
        trim: true,
        match: [/^09\d{9}$/, 'فرمت شماره موبایل صحیح نیست.']
    },
     pushSubscription: {
        type: Object,
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    name: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'operator', 'department_head', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // --- NEW FIELD ---
    permissions: {
        canCreateInvoice: {
            type: Boolean,
            default: false
        },
        canViewAllInvoices: {
            type: Boolean,
            default: false
        },
        canManageTickets: {
             type: Boolean, default: false 
            },
        canViewWooCommerceOrders: { 
            type: Boolean, default: false
         },
        canViewInvoiceStats: {
             type: Boolean, default: false
             },

    },
    // -----------------
    otpRequestTimestamps: {
        type: [Date],
        default: []
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;