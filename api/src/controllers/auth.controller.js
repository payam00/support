const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');
const { generateOTP } = require('../utils/otp.util');
const { notifyOnOtpRequest } = require('../services/notification.service');

const OTP_REQUEST_LIMIT = 4;
const OTP_REQUEST_WINDOW = 60 * 60 * 1000;

/**
 * @desc    Request OTP for login/registration
 * @route   POST /api/auth/request-otp
 */
exports.requestOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { mobileNumber } = req.body;
        let user = await User.findOne({ mobileNumber });

        // --- FIX: Correctly check the single-document settings model ---
        if (!user) {
            // Find the single settings document
            const settings = await Setting.findOne();
            
            // If the setting document doesn't exist OR publicRegistration is explicitly false, deny registration.
            if (!settings || settings.publicRegistration === false) {
                return res.status(403).json({ message: 'ثبت‌نام در حال حاضر برای کاربران جدید غیرفعال است.' });
            }
            
            // If registration is allowed, create a new user.
            user = await User.create({ mobileNumber });
        }
        // -----------------------------------------------------------------

        // Rate Limiting Logic
        const now = Date.now();
        const recentRequests = user.otpRequestTimestamps.filter(
            timestamp => now - timestamp.getTime() < OTP_REQUEST_WINDOW
        );

        if (recentRequests.length >= OTP_REQUEST_LIMIT) {
            return res.status(429).json({ message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید.' });
        }

        // Generate and save OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes expiry
        user.otpRequestTimestamps = [...recentRequests, new Date()];
        await user.save();

        // Send OTP via notification service
        await notifyOnOtpRequest(mobileNumber, otp);

        res.status(200).json({ message: 'کد یکبار مصرف با موفقیت ارسال شد.' });
    } catch (error) {
        console.error("Error in requestOtp controller:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};
/**
 * @desc    Verify OTP and return JWT
 * @route   POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { mobileNumber, otp } = req.body;
        const user = await User.findOne({
            mobileNumber,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'کد وارد شده نامعتبر است یا منقضی شده.' });
        }

        user.otp = null;
        user.otpExpires = null;
        user.isActive = true; 
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: 'ورود با موفقیت انجام شد.',
            token,
            user: {
                _id: user._id,
                name: user.name,
                mobileNumber: user.mobileNumber,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Error in verifyOtp controller:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

/**
 * @desc    Get current logged in user's data
 * @route   GET /api/auth/me
 */
exports.getMe = (req, res) => {
    res.status(200).json(req.user);
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/auth/me/profile
 */
exports.updateMyProfile = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'نام الزامی است.' });
        }
        const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true, runValidators: true });
        res.status(200).json({ message: 'پروفایل با موفقیت به‌روزرسانی شد.', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};