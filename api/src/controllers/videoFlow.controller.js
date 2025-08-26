const mongoose = require('mongoose');
const VideoFlow = require('../models/videoFlow.model.js');

/**
 * @desc    Get the root video flow (the starting point of the widget)
 * @route   GET /api/video-flows/root
 * @access  Public
 */
exports.getRootFlow = async (req, res) => {
    try {
        // Find the single document marked as the root
        const rootFlow = await VideoFlow.findOne({ isRoot: true });

        if (!rootFlow) {
            return res.status(404).json({ message: 'نقطه شروع ویدیوهای تعاملی یافت نشد. لطفاً یک مرحله را به عنوان ریشه (isRoot: true) در پنل ادمین مشخص کنید.' });
        }

        res.status(200).json(rootFlow);
    } catch (error) {
        console.error("Error in getRootFlow:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

/**
 * @desc    Get a specific video flow by its ID
 * @route   GET /api/video-flows/:id
 * @access  Public
 */
exports.getFlowById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID ارسال شده نامعتبر است.' });
        }
        
        const flow = await VideoFlow.findById(id);

        if (!flow) {
            return res.status(404).json({ message: 'مرحله ویدیویی مورد نظر یافت نشد.' });
        }

        res.status(200).json(flow);
    } catch (error) {
        console.error("Error in getFlowById:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

