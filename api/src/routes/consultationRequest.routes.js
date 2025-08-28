const express = require('express');
const router = express.Router();
const { createRequest, getAllRequests } = require('../controllers/consultationRequest.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// مسیر عمومی برای ثبت درخواست از طریق ویجت
router.post('/', createRequest);

// مسیر محافظت شده برای ادمین جهت مشاهده لیست درخواست‌ها
router.get('/', protect, authorize('admin'), getAllRequests);

module.exports = router;