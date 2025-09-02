const User = require('../models/user.model');
const Setting = require('../models/setting.model');

// @desc    Create a new user
exports.addUser = async (req, res) => {
    try {
        const { mobileNumber, name } = req.body;
        if (!mobileNumber || !name) {
            return res.status(400).json({ message: 'نام و شماره موبایل الزامی است.' });
        }
        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser) {
            return res.status(409).json({ message: 'این شماره موبایل قبلاً ثبت شده است.' });
        }
        const user = await User.create({ mobileNumber, name });
        res.status(201).json({ message: 'کاربر با موفقیت ایجاد شد.', user });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-otp -otpExpires');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-otp -otpExpires');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Update a user's details and permissions
exports.updateUser = async (req, res) => {
    try {
        const { name, role, permissions } = req.body;
        const updateFields = {};

        if (name) updateFields.name = name;
        if (role) updateFields.role = role;
        
        // This block now correctly includes ALL permissions
        if (permissions) {
            updateFields['permissions.canCreateInvoice'] = permissions.canCreateInvoice;
            updateFields['permissions.canViewAllInvoices'] = permissions.canViewAllInvoices;
            updateFields['permissions.canManageTickets'] = permissions.canManageTickets;
            updateFields['permissions.canViewWooCommerceOrders'] = permissions.canViewWooCommerceOrders;
            updateFields['permissions.canViewInvoiceStats'] = permissions.canViewInvoiceStats;
        }

        const user = await User.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true, runValidators: true });
        
        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد.' });
        }
        res.status(200).json({ message: 'اطلاعات کاربر به‌روزرسانی شد.', user });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Get system settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findOne();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Update system settings
exports.updateSettings = async (req, res) => {
    try {
        const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.status(200).json({ message: 'تنظیمات با موفقیت به‌روزرسانی شد.', settings });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Reset gateway counters
exports.resetGatewayCounters = async (req, res) => {
    try {
        const { gatewayName } = req.body;
        if (!gatewayName) {
            return res.status(400).json({ message: 'نام درگاه مشخص نشده است.' });
        }

        // Use a more robust find-modify-save pattern
        const settings = await Setting.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'سند تنظیمات یافت نشد.' });
        }

        const gateway = settings.paymentGateways.find(g => g.name === gatewayName);

        if (!gateway) {
            return res.status(404).json({ message: 'درگاه مورد نظر در تنظیمات یافت نشد.' });
        }

        // Reset the counters
        gateway.processedAmount = 0;
        gateway.processedTransactions = 0;

        // Save the entire document
        await settings.save();

        res.status(200).json({ message: `شمارنده‌های درگاه ${gatewayName} با موفقیت ریست شد.` });

    } catch (error) {
        console.error("Error resetting counters:", error);
        res.status(500).json({ message: 'خطا در ریست کردن شمارنده‌ها' });
    }
};