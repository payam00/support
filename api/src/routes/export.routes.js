const express = require('express');
const router = express.Router();
const { exportTicketsToCsv } = require('../controllers/export.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// این مسیر فقط برای ادمین قابل دسترس است
router.get('/tickets', protect, authorize('admin'), exportTicketsToCsv);

module.exports = router;