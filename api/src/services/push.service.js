const webpush = require('web-push');
const User = require('../models/user.model');

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Sends a push notification to a specific user.
 * @param {string} userId - The ID of the user to notify.
 * @param {object} payload - The notification data (title, body, etc.).
 */
const sendNotificationToUser = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (user && user.pushSubscription) {
            console.log(`Sending push notification to user: ${user.name}`);
            const notificationPayload = JSON.stringify(payload);
            await webpush.sendNotification(user.pushSubscription, notificationPayload);
        } else {
            console.log(`User ${userId} not found or has no push subscription.`);
        }
    } catch (error) {
        // If subscription is expired or invalid, error.code might be 410
        console.error(`Error sending push notification to user ${userId}:`, error.message);
        if (error.statusCode === 410) {
            // Subscription is no longer valid, remove it from the database
            await User.findByIdAndUpdate(userId, { $set: { pushSubscription: null } });
            console.log(`Removed expired subscription for user ${userId}`);
        }
    }
};

module.exports = { sendNotificationToUser };