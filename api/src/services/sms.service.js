const axios = require('axios');

// حافظه موقت برای نگهداری توکن
let ippanelApiToken = null;

/**
 * Authenticates with ippanel Edge API and returns a token.
 */
// const getIppanelToken = async () => {
//     if (ippanelApiToken) {
//         return ippanelApiToken;
//     }

//     const username = process.env.IPPANEL_USERNAME;
//     const password = process.env.IPPANEL_PASSWORD;

//     if (!username || !password) {
//         console.error('ippanel username or password is not defined in .env file.');
//         return null;
//     }

//     try {
//         console.log('--- Authenticating with ippanel Edge API ---');
//         const response = await axios.post('https://edge.ippanel.com/v1/api/acl/auth/login', {
//             username,
//             password,
//         });

//         const token = response.data?.data?.token;
//         if (token) {
//             ippanelApiToken = token;
//             console.log('Successfully received ippanel token.');
//             console.log("Received token:", token);

//             return token;
//         } else {
//             console.error('Failed to get token from ippanel response data.');
//             return null;
//         }

//     } catch (error) {
//         console.error('Failed to authenticate with ippanel:');
//         if (error.response) {
//             console.error('Status:', error.response.status);
//             console.error('Data:', JSON.stringify(error.response.data, null, 2));
//         } else {
//             console.error('Error Message:', error.message);
//         }
//         return null;
//     }
// };

/**
 * Sends an SMS using ippanel pattern system.
 * @param {string} patternCode - The ippanel pattern code
 * @param {string} recipientNumber - Recipient's mobile number (E.164 format, e.g. +98912xxxxxxx)
 * @param {object} variables - Variables to inject into the pattern
 */
const sendPatternSms = async (patternCode, recipientNumber, variables = {}) => {
    const token = process.env.IPPANEL_API_KEY; // 👈 API Key ثابت از پنل

    if (!token) {
        console.error('Cannot send SMS: IPPanel API key is missing.');
        return;
    }

    const requestBody = {
        sending_type: "pattern",
        from_number: process.env.IPPANEL_SENDER_NUMBER,
        code: patternCode,
        recipients: [recipientNumber],
        params: variables,
    };

    try {
        console.log(`--- Sending Pattern SMS ---`);
        console.log(`To: ${recipientNumber}, Pattern Code: ${patternCode}`);

        const response = await axios.post(
            'https://edge.ippanel.com/v1/api/send',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            }
        );

        console.log('ippanel SMS sent successfully:', response.data);
        return response.data;

    } catch (error) {
        console.error('Failed to send ippanel Pattern SMS:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
};

module.exports = { sendPatternSms };

