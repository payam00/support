const Ticket = require('../models/ticket.model');
const { Parser } = require('json2csv');
const mongoose = require('mongoose');

exports.exportTicketsToCsv = async (req, res) => {
    try {
        const { departmentId } = req.query;
        let query = {};

        if (departmentId && departmentId !== 'all' && mongoose.Types.ObjectId.isValid(departmentId)) {
            query = { department: new mongoose.Types.ObjectId(departmentId) };
        }

        const tickets = await Ticket.find(query)
            .populate('department', 'name')
            .populate('createdBy', 'name mobileNumber')
            .populate('assignedTo', 'name')
            .populate('messages.sender', 'name')
            .sort({ createdAt: 'desc' })
            .lean(); // .lean() برای عملکرد بهتر

        const formattedData = [];
        tickets.forEach(ticket => {
            if (ticket.messages.length > 0) {
                ticket.messages.forEach(message => {
                    formattedData.push({
                        'Ticket ID': ticket._id.toString(),
                        'عنوان تیکت': ticket.title,
                        'دپارتمان': ticket.department.name,
                        'وضعیت': ticket.status,
                        'اولویت': ticket.priority,
                        'ایجاد شده توسط': ticket.createdBy.name,
                        'مسئول تیکت': ticket.assignedTo ? ticket.assignedTo.name : 'تخصیص نیافته',
                        'فرستنده پیام': message.sender ? message.sender.name : (message.senderType || 'سیستم'),
                        'محتوای پیام': message.content.replace(/(\r\n|\n|\r)/gm, " "), // حذف خطوط جدید
                        'تاریخ پیام': new Date(message.timestamp).toLocaleString('fa-IR'),
                    });
                });
            } else {
                 formattedData.push({
                    'Ticket ID': ticket._id.toString(),
                    'عنوان تیکت': ticket.title,
                    'دپارتمان': ticket.department.name,
                    'وضعیت': ticket.status,
                    'اولویت': ticket.priority,
                    'ایجاد شده توسط': ticket.createdBy.name,
                    'مسئول تیکت': ticket.assignedTo ? ticket.assignedTo.name : 'تخصیص نیافته',
                    'فرستنده پیام': '',
                    'محتوای پیام': '(بدون پیام)',
                    'تاریخ پیام': new Date(ticket.createdAt).toLocaleString('fa-IR'),
                });
            }
        });

        if (formattedData.length === 0) {
            return res.status(404).send("هیچ تیکتی برای خروجی گرفتن با فیلترهای انتخابی یافت نشد.");
        }

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(formattedData);

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(`tickets-export-${new Date().toISOString().split('T')[0]}.csv`);
        res.send("\uFEFF" + csv);

    } catch (error) {
        console.error("Error in exportTicketsToCsv:", error);
        res.status(500).send("خطا در پردازش خروجی.");
    }
};