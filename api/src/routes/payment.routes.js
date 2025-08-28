const express = require('express');
const router = express.Router();
const { createPaymentRequest, handlePaymentCallback } = require('../controllers/payment.controller');

// Route for frontend to get the payment URL
router.post('/request/:token', createPaymentRequest);

// Route for Zarinpal to redirect the user back to
router.get('/callback', handlePaymentCallback);

module.exports = router;