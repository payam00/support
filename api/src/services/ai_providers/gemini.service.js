const axios = require("axios");

const GEMINI_API_KEY = process.env.GAPGPT_API_KEY;
const BASE_URL = "https://api.gapgpt.app/v1beta";
const MODEL_NAME = "gemini-2.0-flash";

/**
 * یک تابع عمومی برای تولید متن از GAPGPT (سرور واسط جمینی)
 * @param {string} prompt متن پرامپت
 * @returns {Promise<string>} متن تولید شده
 */
const generateText = async (prompt) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/models/${MODEL_NAME}:generateContent`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
      }
    );

    const candidates = response.data?.candidates;
    if (candidates && candidates.length > 0) {
      return candidates[0].content.parts[0].text.trim();
    }

    return "";
  } catch (error) {
    console.error("--- DETAILED GAPGPT ERROR ---");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Message:", error.message);
    }
    console.error("--- END GAPGPT ERROR ---");
    return "";
  }
};

module.exports = {
  generateText,
};
