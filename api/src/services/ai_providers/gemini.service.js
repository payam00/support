const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * A generic function to generate text based on a given prompt using Gemini.
 * @param {string} prompt The detailed instruction for the AI model.
 * @returns {Promise<string>} The generated text.
 */
const generateText = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('--- DETAILED GEMINI ERROR ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        console.error('--- END OF GEMINI ERROR ---');
        // Return an empty string on failure to be handled by the calling service.
        return ''; 
    }
};

module.exports = {
    generateText,
};