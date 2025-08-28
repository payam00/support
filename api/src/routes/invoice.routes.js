const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');

const {
    createInvoice,
    getInvoices,
    exportInvoices,
    getInvoiceByToken,
    sendInvoiceSms
} = require('../controllers/invoice.controller');

const { applyDiscount, removeDiscount } = require('../controllers/discount.controller');

const staffRoles = ['operator', 'department_head', 'admin'];

// Private routes
router.route('/')
    .post(protect, authorize(...staffRoles), createInvoice)
    .get(protect, authorize(...staffRoles), getInvoices);

router.route('/export')
    .get(protect, authorize(...staffRoles), exportInvoices);

router.route('/:id/send-sms')
    .post(protect, authorize(...staffRoles), sendInvoiceSms);

// Public routes
router.route('/public/:token')
    .get(getInvoiceByToken); // This is the route that was causing the error

router.route('/public/:token/apply-discount')
    .post(applyDiscount);

router.route('/public/:token/remove-discount')
    .post(removeDiscount);

module.exports = router;