/**
 * Generates a random OTP of a given length.
 * @param {number} length The length of the OTP (default is 6).
 * @returns {string} The generated OTP.
 */
const generateOTP = (length = 6) => {
    // Generates a random number between 100000 and 999999
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

module.exports = { generateOTP };