const User = require('../models/user.model');

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        await User.findByIdAndUpdate(req.user.id, { $set: { pushSubscription: subscription } });
        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save subscription.' });
    }
};

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-key
exports.getVapidKey = (req, res) => {
    res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};