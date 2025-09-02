const paymentService = require('../services/payment.service');
const Invoice = require('../models/invoice.model'); // <-- Import Invoice model

exports.createPaymentRequest = async (req, res) => {
    try {
        const invoiceToken = req.params.token;
        const paymentUrl = await paymentService.initiatePayment(invoiceToken);
        res.status(200).json({ paymentUrl });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --- UPDATED to handle failed redirects with token ---
exports.handlePaymentCallback = async (req, res) => {
    try {
        const invoice = await paymentService.verifyPayment(req.query);
        // On success, redirect to the success page with the token
        res.redirect(`${process.env.FRONTEND_URL}/invoice/success/${invoice.uniqueToken}`);
    } catch (error) {
        // On failure, try to find the invoice token to redirect the user back to their invoice
        let invoiceToken = null;
        const { Authority, clientRefId } = req.query;
        
        try {
            if (Authority) { // Zarinpal
                const failedInvoice = await Invoice.findOne({ paymentAuthority: Authority }).select('uniqueToken');
                if (failedInvoice) invoiceToken = failedInvoice.uniqueToken;
            } else if (clientRefId) { // PayPing
                // For PayPing, the clientRefId is our uniqueToken
                const failedInvoice = await Invoice.findOne({ uniqueToken: clientRefId }).select('uniqueToken');
                if (failedInvoice) invoiceToken = failedInvoice.uniqueToken;
            }
        } catch (dbError) {
            console.error("Error finding invoice on failure:", dbError);
        }

        // Redirect to a specific failure page if token is found, otherwise a generic one
        if (invoiceToken) {
            res.redirect(`${process.env.FRONTEND_URL}/invoice/failed/${invoiceToken}`);
        } else {
            res.redirect(`${process.env.FRONTEND_URL}/invoice/failed/unknown`);
        }
    }
};