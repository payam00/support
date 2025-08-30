const Ticket = require('../models/ticket.model');
const Invoice = require('../models/invoice.model');
const mongoose = require('mongoose');

// @desc    Get dashboard stats for tickets
// @route   GET /api/stats/dashboard
// @access  Private (Managers/Admins)
exports.getDashboardStats = async (req, res) => {
    try {
        const { departmentId } = req.query;
        let matchQuery = {};

        if (req.user.role === 'department_head') {
            const userDepartments = await mongoose.model('Department').find({ head: req.user._id }).select('_id');
            const departmentIds = userDepartments.map(d => d._id);
            matchQuery = { department: { $in: departmentIds } };
        } else if (req.user.role === 'admin' && departmentId) {
            matchQuery = { department: new mongoose.Types.ObjectId(departmentId) };
        }

        const ticketCounts = await Ticket.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const operatorPerformance = await Ticket.aggregate([
            { $match: { ...matchQuery, status: 'Closed', assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', ticketsSolved: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'operatorInfo' } },
            { $unwind: '$operatorInfo' },
            { $project: { _id: 0, operatorName: '$operatorInfo.name', ticketsSolved: 1 } },
            { $sort: { ticketsSolved: -1 } }
        ]);

        const formattedCounts = { Open: 0, Answered: 0, 'In-Progress': 0, Closed: 0, Total: 0 };
        ticketCounts.forEach(item => {
            formattedCounts[item._id] = item.count;
            formattedCounts.Total += item.count;
        });

        res.status(200).json({ ticketCounts: formattedCounts, operatorPerformance });
    } catch (error) {
        res.status(500).json({ message: 'خطا در محاسبه آمار تیکت‌ها' });
    }
};


// --- FINAL AND CORRECTED function for Invoice Stats ---
// @desc    Get dashboard stats for invoices
// @route   GET /api/stats/invoices
// @access  Private (Requires Permission)
exports.getInvoiceStats = async (req, res) => {
    try {
        // --- FIX: A more robust and clear permission check ---
        const isAdmin = req.user.role === 'admin';
        const hasPermission = req.user.permissions && req.user.permissions.canViewInvoiceStats;

        if (!isAdmin && !hasPermission) {
            return res.status(403).json({ message: 'شما مجوز مشاهده آمار فاکتورها را ندارید.' });
        }
        // ----------------------------------------------------
        
        // 1. Get overall invoice counts by status
        const invoiceCounts = await Invoice.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const formattedCounts = { pending: 0, paid: 0, canceled: 0, expired: 0, total: 0 };
        invoiceCounts.forEach(item => {
            if (formattedCounts.hasOwnProperty(item._id)) {
                formattedCounts[item._id] = item.count;
            }
            formattedCounts.total += item.count;
        });

        // 2. Get operator performance
        const operatorPerformance = await Invoice.aggregate([
            { $group: {
                _id: '$createdBy',
                totalIssued: { $sum: 1 },
                totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }
            }},
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'operator' }},
            { $unwind: '$operator' },
            { $project: {
                _id: 0,
                operatorId: '$_id',
                operatorName: '$operator.name',
                totalIssued: 1,
                totalPaid: 1
            }},
            { $sort: { totalIssued: -1 } }
        ]);

        res.status(200).json({ invoiceCounts: formattedCounts, operatorPerformance });

    } catch (error) {
        console.error("Invoice Stats Error:", error);
        res.status(500).json({ message: 'خطا در محاسبه آمار فاکتورها' });
    }
};