const mongoose = require('mongoose');
const { Schema } = mongoose;

const settingSchema = new Schema({
    publicRegistration: { type: Boolean, default: true },
    invoiceValidityHours: { type: Number, default: 24 },
    paymentGateways: {
        zarinpal: {
            // merchantId field is removed from here
            enabled: { type: Boolean, default: false }
        },
        payping: {
            // merchantId field is removed from here
            enabled: { type: Boolean, default: false }
        }
    },
    gatewaySelectionStrategy: {
        type: String,
        enum: ['zarinpal_only', 'payping_only', 'random'],
        default: 'random'
    }
});

const Setting = mongoose.model('Setting', settingSchema);

// Initialize settings if they don't exist
async function initializeSettings() {
    const count = await Setting.countDocuments();
    if (count === 0) {
        await new Setting().save();
        console.log('Global settings document initialized.');
    }
}
initializeSettings();

module.exports = Setting;