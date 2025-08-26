const axios = require('axios');

/**
 * Sends a notification message to a Telegram chat.
 * This is a mock function. Replace with real Telegram Bot API call.
 * @param {string} message The message to send (can use Markdown).
 */
const sendTelegramNotification = async (message) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || token.startsWith('YOUR_')) {
        console.warn('Skipping Telegram notification: Bot Token or Chat ID is not configured.');
        return;
    }

    console.log(`--- MOCK Telegram Bot Service ---`);
    console.log(`To Chat ID: ${chatId}`);
    console.log(`Message: ${message}`);
    console.log(`---------------------------------`);

    // In a real application, you would uncomment this block.
    /*
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('Telegram notification sent successfully.');
    } catch (error) {
        console.error('Failed to send Telegram notification:', error.response ? error.response.data : error.message);
    }
    */
    return Promise.resolve();
};

module.exports = { sendTelegramNotification };