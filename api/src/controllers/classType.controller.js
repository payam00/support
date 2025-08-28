const ClassType = require('../models/classType.model');

// @desc    Get all class types
// @route   GET /api/classtypes
// @access  Private (Admin)
exports.getClassTypes = async (req, res) => {
    try {
        const classTypes = await ClassType.find({ isActive: true });
        res.status(200).json(classTypes);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Create a new class type
// @route   POST /api/classtypes
// @access  Private (Admin)
exports.createClassType = async (req, res) => {
    try {
        const { name, price, termsAndConditions } = req.body;
        const newClassType = await ClassType.create({ name, price, termsAndConditions });
        res.status(201).json(newClassType);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور', error: error.message });
    }
};

// @desc    Update a class type
// @route   PUT /api/classtypes/:id
// @access  Private (Admin)
exports.updateClassType = async (req, res) => {
    try {
        const { name, price, termsAndConditions, isActive } = req.body;
        const classType = await ClassType.findByIdAndUpdate(req.params.id, { name, price, termsAndConditions, isActive }, { new: true, runValidators: true });
        if (!classType) {
            return res.status(404).json({ message: 'نوع کلاس یافت نشد.' });
        }
        res.status(200).json(classType);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};