const Ticket = require('../models/ticket.model');
const Department = require('../models/department.model');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
    try {
        const { role, _id } = req.user;
        // --- FIX: startDate and endDate were used before being defined ---
        const { departmentId, startDate, endDate } = req.query; 

        let departmentIds = [];

        if (role === 'admin') {
            if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
                departmentIds = [new mongoose.Types.ObjectId(departmentId)];
            }
        } else if (role === 'department_head') {
            const userDepartments = await Department.find({ head: _id }).select('_id');
            departmentIds = userDepartments.map(d => d._id);
        } else {
            return res.status(403).json({ message: 'دسترسی مجاز نیست.' });
        }
        
        const matchQuery = departmentIds.length > 0
            ? { department: { $in: departmentIds } }
            : {};
        
        if (startDate && endDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        
        const statusStats = await Ticket.aggregate([ { $match: matchQuery }, { $group: { _id: '$status', count: { $sum: 1 } } } ]);
        const ticketCounts = { Open: 0, Answered: 0, 'In-Progress': 0, Closed: 0, Total: 0 };
        statusStats.forEach(stat => {
            if (ticketCounts.hasOwnProperty(stat._id)) ticketCounts[stat._id] = stat.count;
        });
        ticketCounts.Total = statusStats.reduce((sum, stat) => sum + stat.count, 0);

        const operatorPerformance = await Ticket.aggregate([
            { $match: { ...matchQuery, assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'operator' } },
            { $unwind: '$operator' },
            { $project: { _id: 0, operatorName: '$operator.name', ticketsSolved: '$count' } }
        ]);

        res.status(200).json({ ticketCounts, operatorPerformance });

    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};