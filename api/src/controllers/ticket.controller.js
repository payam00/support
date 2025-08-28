const Ticket = require('../models/ticket.model');
const Department = require('../models/department.model');
const User = require('../models/user.model');
const Learning = require('../models/learning.model');
const aiService = require('../services/ai.service');
const { notifyOnNewTicket, notifyOnOperatorReply } = require('../services/notification.service');

exports.createTicket = async (req, res) => {
    try {
        const { title, priority, department, content } = req.body;
        const createdBy = req.user._id;
        const userMessage = { sender: createdBy, senderType: 'user', content, type: 'text' };
        
        const ticket = new Ticket({
            title,
            priority,
            department,
            createdBy,
            messages: [userMessage],
            status: 'Open' // وضعیت اولیه اکنون همیشه Open است
        });

        const dept = await Department.findById(department);
        if (!dept) {
            return res.status(404).json({ message: 'دپارتمان انتخاب شده معتبر نیست.' });
        }
        
        const aiResponseContent = await aiService.getInitialAnswer(ticket, dept);

        // --- FIX: Final, robust logic to handle all AI response scenarios ---
        if (aiResponseContent && aiResponseContent.trim() !== '' && !aiResponseContent.includes('کارشناسان ما')) {
            // سناریو ۱: هوش مصنوعی پاسخ معتبری دارد
            const aiMessage = { senderType: 'ai', content: aiResponseContent, type: 'text' };
            ticket.messages.push(aiMessage);
            ticket.status = 'Answered by AI';
        } else {
            // سناریو ۲: هوش مصنوعی پاسخ را نمی‌داند یا خطایی رخ داده است
            // یک پیام سیستمی برای شفاف‌سازی به کاربر اضافه می‌کنیم
            const systemMessage = {
                senderType: 'system',
                content: 'سوال شما برای بررسی توسط کارشناسان ما ثبت شد و به زودی پاسخگو خواهند بود.',
                type: 'text'
            };
            ticket.messages.push(systemMessage);
            // وضعیت 'Open' باقی می‌ماند و نوتیفیکیشن برای اپراتورها ارسال می‌شود
            notifyOnNewTicket(ticket).catch(err => console.error("Error sending notification for new ticket:", err));
        }
        
        await ticket.save();
        res.status(201).json({ message: 'تیکت شما با موفقیت ثبت شد.', ticket });

    } catch (error) {
        console.error("Error in createTicket:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// ... (تمام ۱۱ تابع دیگر کنترلر که کامل و صحیح هستند در اینجا قرار دارند)
exports.getTickets = async (req, res) => {
    try {
        let query = {};
        const { role, _id } = req.user;
        const { view } = req.query;
        if (role === 'user') {
            query = { createdBy: _id };
        } else if (['operator', 'department_head', 'admin'].includes(role)) {
            const userDepartments = await Department.find({ $or: [{ head: _id }, { operators: _id }] }).select('_id');
            const departmentIds = userDepartments.map(d => d._id);
            if (departmentIds.length === 0 && role !== 'admin') {
                return res.status(200).json([]);
            }
            if (role === 'department_head' || role === 'admin') {
                query = departmentIds.length > 0 ? { department: { $in: departmentIds } } : {};
                if (view === 'referred') {
                    query.status = 'Referred';
                }
            } else if (role === 'operator') {
                query = { department: { $in: departmentIds }, $or: [{ assignedTo: null }, { assignedTo: _id }] };
            }
        }
        const tickets = await Ticket.find(query).populate('department', 'name').populate('createdBy', 'name').populate('assignedTo', 'name').sort({ updatedAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Error in getTickets:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate({path: 'department', select: 'name operators', populate: {path: 'operators', select: 'name _id'}}).populate('createdBy', 'name role').populate('messages.sender', 'name role').populate('assignedTo', 'name role').populate('referralHistory.referredBy', 'name').populate('referralHistory.fromDepartment', 'name').populate('referralHistory.toDepartment', 'name');
        if (!ticket) { return res.status(404).json({ message: 'تیکت یافت نشد.' }); }
        res.status(200).json(ticket);
    } catch (error) {
        console.error("Error in getTicketById:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.addMessage = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('department');
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        const { role, _id } = req.user;
        const isCreator = ticket.createdBy.equals(_id);
        const isManager = role === 'department_head' || role === 'admin';
        const isAssignedToMe = ticket.assignedTo && ticket.assignedTo.equals(_id);
        let canReply = false;
        if (role === 'user' && isCreator) { canReply = true; } 
        else if (isManager) { canReply = true; } 
        else if (role === 'operator') { if (!ticket.assignedTo || isAssignedToMe) { canReply = true; } }
        if (!canReply) { return res.status(403).json({ message: 'شما مجاز به پاسخ به این تیکت نیستید.' }); }
        const { content, voiceDuration } = req.body;
        let newMessage;
        if (req.file) {
            if (!voiceDuration) return res.status(400).json({ message: 'مدت زمان ویس الزامی است.' });
            newMessage = { sender: _id, senderType: 'operator', content: req.file.path, type: 'voice', voiceDuration: Number(voiceDuration) };
        } else {
            if (!content) return res.status(400).json({ message: 'متن پیام الزامی است.' });
            newMessage = { sender: _id, senderType: role === 'user' ? 'user' : 'operator', content: content, type: 'text' };
        }
        ticket.messages.push(newMessage);
        const isUserReply = role === 'user';
        ticket.status = isUserReply ? 'In-Progress' : 'Answered';
        if (isUserReply) { ticket.summary = undefined; }
        await ticket.save();
        if (!isUserReply) {
            notifyOnOperatorReply(ticket).catch(err => console.error(err));
            if (newMessage.type === 'text') {
                ticket.populate('messages.sender').then(pTicket => aiService.getSummary(pTicket).then(summary => { if (summary && !summary.startsWith('خطا')) { Learning.create({ ticketSummary: summary, successfulReply: newMessage.content, ticketId: ticket._id, department: ticket.department._id }).catch(err => console.error(err)); } }).catch(err => console.error(err)));
            }
        }
        res.status(201).json({ message: 'پیام با موفقیت ارسال شد.' });
    } catch (error) {
        console.error("Error in addMessage:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Open', 'Answered', 'In-Progress', 'Closed', 'Awaiting AI', 'Answered by AI', 'Referred'];
        if (!status || !validStatuses.includes(status)) { return res.status(400).json({ message: 'وضعیت ارسال شده نامعتبر است.' }); }
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        res.status(200).json({ message: 'وضعیت تیکت با موفقیت به‌روزرسانی شد.', ticket });
    } catch (error) {
        console.error("Error in updateTicketStatus:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.getTicketSummary = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('messages.sender');
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        const lastUserMessage = [...ticket.messages].reverse().find(m => m.sender.role === 'user');
        if (ticket.summary && ticket.summary.content && (!lastUserMessage || new Date(ticket.summary.lastUpdated) >= new Date(lastUserMessage.timestamp))) { return res.status(200).json({ summary: ticket.summary.content }); }
        const summaryText = await aiService.getSummary(ticket);
        ticket.summary = { content: summaryText, lastUpdated: new Date() };
        await ticket.save();
        res.status(200).json({ summary: summaryText });
    } catch (error) {
        res.status(500).json({ message: 'خطا در تولید خلاصه' });
    }
};

exports.getTicketSuggestions = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('department').populate('messages.sender');
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        const suggestions = await aiService.getSuggestions(ticket);
        res.status(200).json({ suggestions });
    } catch (error) {
        console.error("Error in getTicketSuggestions:", error);
        res.status(500).json({ message: 'خطای سرور برای پیشنهاد پاسخ' });
    }
};

exports.assignTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        const { role, _id } = req.user;
        const { operatorId } = req.body;
        const isManager = role === 'department_head' || role === 'admin';
        const isOperator = role === 'operator';
        let targetOperatorId;
        if (isManager && operatorId) {
            const operatorExists = await User.exists({ _id: operatorId });
            if (!operatorExists) return res.status(404).json({ message: 'اپراتور مورد نظر یافت نشد.' });
            targetOperatorId = operatorId;
        } else if (isOperator) {
            if (ticket.assignedTo) return res.status(400).json({ message: 'این تیکت قبلاً تخصیص داده شده است.' });
            targetOperatorId = _id;
        } else {
            return res.status(400).json({ message: 'درخواست نامعتبر است.' });
        }
        ticket.assignedTo = targetOperatorId;
        await ticket.save();
        const populatedTicket = await ticket.populate('assignedTo', 'name');
        res.status(200).json({ message: `تیکت به ${populatedTicket.assignedTo.name} تخصیص داده شد.`, ticket: populatedTicket });
    } catch (error) {
        console.error("Error in assignTicket:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.referTicket = async (req, res) => {
    try {
        const { note, targetDepartmentId } = req.body;
        if (!note) return res.status(400).json({ message: 'یادداشت ارجاع الزامی است.' });
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        const { role, _id } = req.user;
        if (role === 'operator' && (!ticket.assignedTo || !ticket.assignedTo.equals(_id))) {
            return res.status(403).json({ message: 'شما فقط می‌توانید تیکتی را که به خودتان تخصیص داده‌اید ارجاع دهید.' });
        }
        const referral = { referredBy: _id, note, fromDepartment: ticket.department };
        if (role === 'operator') {
            ticket.status = 'Referred';
        } else if ((role === 'department_head' || role === 'admin') && targetDepartmentId) {
            const targetDept = await Department.findById(targetDepartmentId);
            if (!targetDept) return res.status(404).json({ message: 'دپارتمان مقصد یافت نشد.' });
            referral.toDepartment = targetDepartmentId;
            ticket.department = targetDepartmentId;
            ticket.assignedTo = null;
            ticket.status = 'Open';
            notifyOnNewTicket(ticket).catch(err => console.error(err));
        } else {
            return res.status(400).json({ message: 'درخواست ارجاع نامعتبر است.' });
        }
        ticket.referralHistory.push(referral);
        await ticket.save();
        res.status(200).json({ message: 'تیکت با موفقیت ارجاع داده شد.', ticket });
    } catch (error) {
        console.error("Error in referTicket:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.escalateToHuman = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        if (!ticket.createdBy.equals(req.user._id)) return res.status(403).json({ message: 'دسترسی مجاز نیست.' });
        ticket.status = 'Open';
        await ticket.save();
        notifyOnNewTicket(ticket).catch(err => console.error(err));
        res.status(200).json({ message: 'تیکت شما به کارشناسان انسانی ارجاع داده شد.', ticket });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.resolveByAi = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        if (!ticket.createdBy.equals(req.user._id)) return res.status(403).json({ message: 'دسترسی مجاز نیست.' });
        ticket.status = 'Closed';
        const systemMessage = { senderType: 'system', content: 'این تیکت توسط هوش مصنوعی حل و توسط کاربر تایید شد.', type: 'text' };
        ticket.messages.push(systemMessage);
        await ticket.save();
        res.status(200).json({ message: 'از اینکه بازخورد خود را ثبت کردید متشکریم!', ticket });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};