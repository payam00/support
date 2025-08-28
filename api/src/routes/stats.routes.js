const express = require('express');
const router = express.Router();
const { getDashboardStats, getInvoiceStats } = require('../controllers/stats.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/dashboard', protect, authorize('admin', 'department_head'), getDashboardStats);
router.get('/invoices', protect, getInvoiceStats);

module.exports = router;