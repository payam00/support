const mongoose = require('mongoose');
const { Schema } = mongoose;

const gatewaySchema = new Schema({
    name: { type: String, required: true, enum: ['zarinpal', 'payping'] },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    // Amount-based fields
    maxAmount: { type: Number, default: 0 },
    processedAmount: { type: Number, default: 0 },
    // --- NEW: Transaction-based fields ---
    maxTransactions: { type: Number, default: 0 },
    processedTransactions: { type: Number, default: 0 },
    // ------------------------------------
    priority: { type: Number, default: 0 }
}, { _id: false });

const settingSchema = new Schema({
    publicRegistration: { type: Boolean, default: true },
    invoiceValidityHours: { type: Number, default: 24 },
    paymentGateways: [gatewaySchema],
    gatewaySelectionStrategy: {
        type: String,
        enum: ['zarinpal_only', 'payping_only', 'random', 'amount_based', 'transaction_based'], // <-- Added 'transaction_based'
        default: 'random'
    }
});

const Setting = mongoose.model('Setting', settingSchema);

// Initialize settings with new fields
async function initializeSettings() {
    const count = await Setting.countDocuments();
    if (count === 0) {
        await new Setting({
            paymentGateways: [
                { name: 'zarinpal', label: 'زرین‌پال', maxAmount: 50000000, priority: 1, maxTransactions: 1000 },
                { name: 'payping', label: 'پی‌پینگ', maxAmount: 50000000, priority: 2, maxTransactions: 1000 }
            ]
        }).save();
        console.log('Global settings document initialized with default gateways.');
    }
}
initializeSettings();

module.exports = Setting;