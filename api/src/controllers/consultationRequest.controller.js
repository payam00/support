const ConsultationRequest = require('../models/consultationRequest.model');

/**
 * @desc    Create a new consultation request
 * @route   POST /api/consultation-requests
 * @access  Public
 */
exports.createRequest = async (req, res) => {
    try {
        const { name, mobileNumber, sourceUrl } = req.body;

        if (!name || !mobileNumber) {
            return res.status(400).json({ message: 'نام و شماره موبایل الزامی است.' });
        }

        const newRequest = await ConsultationRequest.create({
            name,
            mobileNumber,
            sourceUrl
        });

        // در یک پروژه واقعی، اینجا می‌توانید یک نوتیفیکیشن (ایمیل یا پیامک) برای ادمین ارسال کنید
        
        res.status(201).json({ message: 'درخواست شما با موفقیت ثبت شد. به زودی با شما تماس خواهیم گرفت.' });
    } catch (error) {
        console.error("Error in createRequest:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// تابع دریافت لیست درخواست‌ها برای پنل ادمین
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await ConsultationRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error in getAllRequests:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};