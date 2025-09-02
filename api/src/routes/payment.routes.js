const express = require('express');
const router = express.Router();
const { createPaymentRequest, handlePaymentCallback } = require('../controllers/payment.controller');

// Route for frontend to get the payment URL
router.post('/request/:token', createPaymentRequest);

router.route('/callback')
    .get(handlePaymentCallback)
    .post(handlePaymentCallback);
module.exports = router;