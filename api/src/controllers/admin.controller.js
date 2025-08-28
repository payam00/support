const User = require('../models/user.model');
const Setting = require('../models/setting.model');

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
        console.error("Error in addUser:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-otp -otpExpires');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, role, permissions } = req.body;
        const updateFields = {};

        if (name) updateFields.name = name;
        if (role) updateFields.role = role;
        
        if (permissions) {
            updateFields['permissions.canCreateInvoice'] = permissions.canCreateInvoice;
            updateFields['permissions.canViewAllInvoices'] = permissions.canViewAllInvoices;
            updateFields['permissions.canManageTickets'] = permissions.canManageTickets;
            updateFields['permissions.canViewWooCommerceOrders'] = permissions.canViewWooCommerceOrders;
            updateFields['permissions.canViewInvoiceStats'] = permissions.canViewInvoiceStats;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!user) return res.status(404).json({ message: 'کاربر یافت نشد.' });
        
        res.status(200).json({ message: 'اطلاعات کاربر به‌روزرسانی شد.', user });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findOne();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// --- Final and Correct version of updateSettings ---
exports.updateSettings = async (req, res) => {
    try {
        // This logic correctly updates the entire settings object
        const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.status(200).json({ message: 'تنظیمات با موفقیت به‌روزرسانی شد.', settings });
    } catch (error) {
        console.error("Error in updateSettings:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};