const mongoose = require('mongoose');
const crypto = require('crypto');

const invoiceSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    nationality: { type: String, enum: ['iranian', 'foreign'], required: true },
    nationalId: { type: String },
    mobileNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    finalAmount: { type: Number, required: true }, // مبلغ نهایی پس از تخفیf
    classType: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassType', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'canceled', 'expired'], 
        default: 'pending' 
    },
    uniqueToken: { type: String, unique: true },
    termsAccepted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date }, // تاریخ انقضای فاکتور
    discount: {
        code: String,
        amount: Number
    },
       paymentRefId: { 
        type: String
    },
    // --- Fields for Payment Gateway ---
    paymentGateway: { 
        type: String,
        enum: ['zarinpal', 'payping']
    },
    paymentAuthority: { // For storing Zarinpal's authority or PayPing's code
        type: String 
    },
    paymentRefId: { // For storing the final reference ID after verification
        type: String
    },
       lastSmsSentAt: {
        type: Date,
        default: null
    },
    // ------------------------------------
}, { timestamps: true });

invoiceSchema.pre('save', function(next) {
    if (this.isNew) {
        this.uniqueToken = crypto.randomBytes(20).toString('hex');
        if (this.finalAmount === undefined) {
            this.finalAmount = this.amount;
        }
    }
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);