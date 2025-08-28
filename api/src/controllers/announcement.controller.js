const Announcement = require('../models/announcement.model');

// @desc    Get all announcements (for admin panel)
exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().populate('createdBy', 'name').sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Get only active and relevant announcements (for dashboard)
exports.getActiveAnnouncements = async (req, res) => {
    try {
        const userRole = req.user.role;
        const announcements = await Announcement.find({
            isActive: true,
            // Show if targetRoles is empty (for all) OR if user's role is in the targetRoles array
            $or: [
                { targetRoles: { $size: 0 } },
                { targetRoles: userRole }
            ]
        }).sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Create a new announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, type, isActive, targetRoles } = req.body;
        const announcement = await Announcement.create({
            title,
            content,
            type,
            isActive,
            targetRoles, // <-- Add new field
            createdBy: req.user._id
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Update an announcement
exports.updateAnnouncement = async (req, res) => {
    try {
        const { title, content, type, isActive, targetRoles } = req.body;
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { title, content, type, isActive, targetRoles }, // <-- Add new field
            { new: true, runValidators: true }
        );
        if (!announcement) {
            return res.status(404).json({ message: 'اطلاعیه یافت نشد.' });
        }
        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Delete an announcement
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'اطلاعیه یافت نشد.' });
        }
        res.status(200).json({ message: 'اطلاعیه با موفقیت حذف شد.' });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};