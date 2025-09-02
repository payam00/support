const Announcement = require('../models/announcement.model');
const User = require('../models/user.model');
const { sendNotificationToUser } = require('../services/push.service');
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

// @desc    Create a new announcement and notify users
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, type, isActive, targetRoles } = req.body;
        const announcement = await Announcement.create({
            title,
            content,
            type,
            isActive,
            targetRoles,
            createdBy: req.user._id
        });

        // --- NEW: Send push notifications if the announcement is active ---
        if (announcement.isActive) {
            // Build the query to find target users
            const query = {
                pushSubscription: { $ne: null, $exists: true } // Find users who are subscribed
            };

            // If roles are specified, add them to the query
            if (targetRoles && targetRoles.length > 0) {
                query.role = { $in: targetRoles };
            }

            const usersToNotify = await User.find(query).select('_id');

            if (usersToNotify.length > 0) {
                console.log(`Sending notification for new announcement to ${usersToNotify.length} user(s).`);
                
                const payload = {
                    title: `اطلاعیه جدید: ${announcement.title}`,
                    body: 'یک اطلاعیه جدید در پنل منتشر شد. برای مشاهده کلیک کنید.',
                    url: '/dashboard' 
                };
                
                // Send notifications in parallel without waiting for all to finish
                const notificationPromises = usersToNotify.map(user => 
                    sendNotificationToUser(user._id, payload)
                );
                Promise.all(notificationPromises);
            }
        }
                res.status(201).json(announcement);
    } catch (error) {
        console.error("Error creating announcement:", error);
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