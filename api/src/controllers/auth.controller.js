const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');
const { generateOTP } = require('../utils/otp.util');
const { notifyOnOtpRequest } = require('../services/notification.service');

const OTP_REQUEST_LIMIT = 4; // Max OTP requests
const OTP_REQUEST_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * @desc    Request OTP for login/registration with Rate Limiting
 * @route   POST /api/auth/request-otp
 */
exports.requestOtp = async (req, res) => {
    // 1. Validate input using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { mobileNumber } = req.body;
        
        // 2. Check if public registration is enabled
        const publicRegistrationSetting = await Setting.findOne({ key: 'publicRegistration' });
        
        let user = await User.findOne({ mobileNumber });

        // 3. If registration is disabled and user does not exist, block them.
        if (!publicRegistrationSetting?.value && !user) {
            return res.status(403).json({ message: 'ثبت‌نام در حال حاضر برای کاربران جدید غیرفعال است.' });
        }
        
        // 4. If user does not exist, create them.
        if (!user) {
            user = await User.create({ mobileNumber });
        }

        // 5. Rate Limiting Logic
        const now = Date.now();
        // Filter out timestamps older than the time window (1 hour)
        const recentRequests = user.otpRequestTimestamps.filter(
            timestamp => now - timestamp.getTime() < OTP_REQUEST_WINDOW
        );

        if (recentRequests.length >= OTP_REQUEST_LIMIT) {
            return res.status(429).json({ message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید.' });
        }

        // 6. Generate and save OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes expiry
        user.otpRequestTimestamps = [...recentRequests, new Date()]; // Add new timestamp
        
        await user.save();

        // 7. Send OTP via notification service
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
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { mobileNumber, otp } = req.body;

        // 2. Find user with a valid, non-expired OTP
        const user = await User.findOne({
            mobileNumber,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'کد وارد شده نامعتبر است یا منقضی شده.' });
        }

        // 3. Clear OTP to prevent reuse and activate user
        user.otp = null;
        user.otpExpires = null;
        user.isActive = true; 
        await user.save();

        // 4. Create and sign JWT
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
 * @access  Private (requires 'protect' middleware)
 */
exports.getMe = (req, res) => {
    // The 'protect' middleware already fetched the user and attached it to req.user
    // We just need to send it back.
    res.status(200).json(req.user);
};
exports.updateMyProfile = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'نام الزامی است.' });
        }
        // req.user از میدلور protect می‌آید
        const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true, runValidators: true });
        res.status(200).json({ message: 'پروفایل با موفقیت به‌روزرسانی شد.', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};