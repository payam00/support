const paymentService = require('../services/payment.service');

exports.createPaymentRequest = async (req, res) => {
    try {
        const invoiceToken = req.params.token;
        const paymentUrl = await paymentService.initiatePayment(invoiceToken);
        res.status(200).json({ paymentUrl });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.handlePaymentCallback = async (req, res) => {
    try {
        const invoice = await paymentService.verifyPayment(req.query);
        
        res.redirect(`${process.env.FRONTEND_URL}/invoice/success/${invoice.uniqueToken}`);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL}/invoice/failed`);
    }
};