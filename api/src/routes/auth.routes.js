const express = require('express');
const { body } = require('express-validator');
// updateMyProfile به این لیست اضافه شد
const { requestOtp, verifyOtp, getMe, updateMyProfile } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/request-otp', 
    body('mobileNumber').isMobilePhone('fa-IR').withMessage('فرمت شماره موبایل صحیح نیست.'),
    requestOtp
);

router.post('/verify-otp',
    [
        body('mobileNumber').isMobilePhone('fa-IR').withMessage('فرمت شماره موبایل صحیح نیست.'),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('کد باید ۶ رقمی باشد.').isNumeric().withMessage('کد باید عددی باشد.')
    ],
    verifyOtp
);

router.get('/me', protect, getMe);

// مسیر جدید برای آپدیت پروفایل کاربر لاگین کرده
router.put(
    '/me/profile', 
    protect, 
    body('name').notEmpty().withMessage('نام الزامی است.').trim(),
    updateMyProfile
);

module.exports = router;