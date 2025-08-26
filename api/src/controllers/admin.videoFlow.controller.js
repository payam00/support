const VideoFlow = require('../models/videoFlow.model.js');
const mongoose = require('mongoose');

/**
 * @desc    Get all video flows for the admin panel
 * @route   GET /api/admin/video-flows
 * @access  Admin
 */
exports.getAllFlows = async (req, res) => {
    try {
        const flows = await VideoFlow.find().sort({ createdAt: -1 });
        res.status(200).json(flows);
    } catch (error) {
        console.error("Error in getAllFlows:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

/**
 * @desc    Create a new video flow step
 * @route   POST /api/admin/video-flows
 * @access  Admin
 */
exports.createFlow = async (req, res) => {
    try {
        const { name, videoUrl, previewVideoUrl, isRoot, questions, ctaPhoneNumber, ctaFormEnabled } = req.body;

        if (!name || !videoUrl) {
            return res.status(400).json({ message: 'نام و آدرس ویدیو الزامی است.' });
        }

        // If a flow is being set as root, ensure no other flow is root.
        if (isRoot) {
            await VideoFlow.updateMany({ isRoot: true }, { $set: { isRoot: false } });
        }

        const newFlow = await VideoFlow.create({
            name,
            videoUrl,
            previewVideoUrl,
            isRoot,
            questions,
            ctaPhoneNumber,
            ctaFormEnabled
        });

        res.status(201).json(newFlow);
    } catch (error) {
        console.error("Error in createFlow:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

/**
 * @desc    Update an existing video flow step
 * @route   PUT /api/admin/video-flows/:id
 * @access  Admin
 */
exports.updateFlow = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, videoUrl, previewVideoUrl, isRoot, questions, ctaPhoneNumber, ctaFormEnabled } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID نامعتبر است.' });
        }

        // If a flow is being set as root, ensure no other flow is root.
        if (isRoot) {
            await VideoFlow.updateMany({ _id: { $ne: id }, isRoot: true }, { $set: { isRoot: false } });
        }

        const updatedFlow = await VideoFlow.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedFlow) {
            return res.status(404).json({ message: 'مرحله ویدیویی یافت نشد.' });
        }

        res.status(200).json(updatedFlow);
    } catch (error) {
        console.error("Error in updateFlow:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

/**
 * @desc    Delete a video flow step
 * @route   DELETE /api/admin/video-flows/:id
 * @access  Admin
 */
exports.deleteFlow = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID نامعتبر است.' });
        }

        // Prevent deletion if this flow is being used by another flow
        const referringFlows = await VideoFlow.find({ 'questions.nextFlow': id });
        if (referringFlows.length > 0) {
            return res.status(400).json({
                message: `این مرحله را نمی‌توان حذف کرد زیرا توسط ${referringFlows.length} مرحله دیگر استفاده می‌شود.`,
                referringFlowNames: referringFlows.map(f => f.name)
            });
        }

        const deletedFlow = await VideoFlow.findByIdAndDelete(id);
        if (!deletedFlow) {
            return res.status(404).json({ message: 'مرحله ویدیویی یافت نشد.' });
        }

        res.status(200).json({ message: 'مرحله ویدیویی با موفقیت حذف شد.' });
    } catch (error) {
        console.error("Error in deleteFlow:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};