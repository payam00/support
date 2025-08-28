const Ticket = require('../models/ticket.model');
const Department = require('../models/department.model');
const User = require('../models/user.model');
const Learning = require('../models/learning.model');
const aiService = require('../services/ai.service');
const { notifyOnNewTicket, notifyOnOperatorReply } = require('../services/notification.service');

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (User)
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
            status: 'Open'
        });

        const dept = await Department.findById(department);
        if (!dept) {
            return res.status(404).json({ message: 'دپارتمان انتخاب شده معتبر نیست.' });
        }
        
        const aiResponseContent = await aiService.getInitialAnswer(ticket, dept);

        if (aiResponseContent && aiResponseContent.trim() !== '' && !aiResponseContent.includes('کارشناسان ما')) {
            const aiMessage = { senderType: 'ai', content: aiResponseContent, type: 'text' };
            ticket.messages.push(aiMessage);
            ticket.status = 'Answered by AI';
        } else {
            const systemMessage = {
                senderType: 'system',
                content: 'سوال شما برای بررسی توسط کارشناسان ما ثبت شد و به زودی پاسخگو خواهند بود.',
                type: 'text'
            };
            ticket.messages.push(systemMessage);
            notifyOnNewTicket(ticket).catch(err => console.error("Error sending notification for new ticket:", err));
        }
        
        await ticket.save();
        res.status(201).json({ message: 'تیکت شما با موفقیت ثبت شد.', ticket });

    } catch (error) {
        console.error("Error in createTicket:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Get tickets based on user role and permissions
// @route   GET /api/tickets
// @access  Private
exports.getTickets = async (req, res) => {
    try {
        const { role, _id, permissions } = req.user;
        let query = {};

        if (role === 'user') {
            query = { createdBy: _id };
        } else if (role === 'admin' || (permissions && permissions.canManageTickets)) {
            const userDepartments = await Department.find({ $or: [{ head: _id }, { operators: _id }] }).select('_id');
            const departmentIds = userDepartments.map(d => d._id);
            
            if (role !== 'admin' && departmentIds.length > 0) {
                 query = { department: { $in: departmentIds }};
            }
            // For admin, query remains {} to get all tickets
        } else {
             return res.status(403).json({ message: 'شما مجوز دسترسی به تیکت‌ها را ندارید.' });
        }

        const tickets = await Ticket.find(query).populate('department', 'name').populate('createdBy', 'name').populate('assignedTo', 'name').sort({ updatedAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Error in getTickets:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Get a single ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate({path: 'department', select: 'name operators', populate: {path: 'operators', select: 'name _id'}}).populate('createdBy', 'name role').populate('messages.sender', 'name role').populate('assignedTo', 'name role').populate('referralHistory.referredBy', 'name').populate('referralHistory.fromDepartment', 'name').populate('referralHistory.toDepartment', 'name');
        if (!ticket) { return res.status(404).json({ message: 'تیکت یافت نشد.' }); }

        const { role, _id, permissions } = req.user;
        
        const isOwner = ticket.createdBy._id.equals(_id);
        const hasAccess = (role === 'admin' || (permissions && permissions.canManageTickets));

        if (role === 'user' && !isOwner) {
            return res.status(403).json({ message: 'شما فقط به تیکت‌های خود دسترسی دارید.' });
        }
        if (role !== 'user' && !hasAccess) {
             return res.status(403).json({ message: 'شما مجوز دسترسی به این تیکت را ندارید.' });
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error("Error in getTicketById:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Add a message to a ticket
// @route   POST /api/tickets/:id/messages
// @access  Private
exports.addMessage = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });

        const { role, _id, permissions } = req.user;
        const isOwner = ticket.createdBy.equals(_id);
        const hasAccess = (role === 'admin' || (permissions && permissions.canManageTickets));

        if (role === 'user' && !isOwner) {
            return res.status(403).json({ message: 'شما فقط می‌توانید به تیکت‌های خود پاسخ دهید.' });
        }
        if (role !== 'user' && !hasAccess) {
             return res.status(403).json({ message: 'شما مجوز پاسخ به این تیکت را ندارید.' });
        }

        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'متن پیام الزامی است.' });

        const newMessage = { sender: _id, senderType: role === 'user' ? 'user' : 'operator', content, type: 'text' };
        ticket.messages.push(newMessage);
        
        const isUserReply = role === 'user';
        ticket.status = isUserReply ? 'In-Progress' : 'Answered';
        
        if (isUserReply) { 
            ticket.summary = undefined; // Invalidate AI summary on user reply
        }

        await ticket.save();

        if (!isUserReply) {
            notifyOnOperatorReply(ticket).catch(err => console.error(err));
        }
        
        res.status(201).json({ message: 'پیام با موفقیت ارسال شد.' });
    } catch (error) {
        console.error("Error in addMessage:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private (Staff)
exports.updateTicketStatus = async (req, res) => {
    try {
        const { role, permissions } = req.user;
        if (role !== 'admin' && !(permissions && permissions.canManageTickets)) {
            return res.status(403).json({ message: 'شما مجوز تغییر وضعیت تیکت را ندارید.' });
        }

        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        
        res.status(200).json({ message: 'وضعیت تیکت با موفقیت به‌روزرسانی شد.', ticket });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Assign a ticket to an operator
// @route   PUT /api/tickets/:id/assign
// @access  Private (Staff)
exports.assignTicket = async (req, res) => {
    try {
        const { role, _id, permissions } = req.user;
        if (role !== 'admin' && !(permissions && permissions.canManageTickets)) {
            return res.status(403).json({ message: 'شما مجوز تخصیص تیکت را ندارید.' });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });

        const { operatorId } = req.body;
        const targetOperatorId = operatorId || _id; // Assign to self if no operatorId is provided

        ticket.assignedTo = targetOperatorId;
        await ticket.save();

        const populatedTicket = await ticket.populate('assignedTo', 'name');
        res.status(200).json({ message: `تیکت به ${populatedTicket.assignedTo.name} تخصیص داده شد.`, ticket: populatedTicket });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Refer a ticket
// @route   POST /api/tickets/:id/refer
// @access  Private (Staff)
exports.referTicket = async (req, res) => {
    try {
        const { role, _id, permissions } = req.user;
        if (role !== 'admin' && !(permissions && permissions.canManageTickets)) {
            return res.status(403).json({ message: 'شما مجوز ارجاع تیکت را ندارید.' });
        }

        const { note, targetDepartmentId } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });

        const referral = { referredBy: _id, note, fromDepartment: ticket.department };
        
        if (role === 'operator' || role === 'department_head') {
            ticket.status = 'Referred';
        }
        if ((role === 'department_head' || role === 'admin') && targetDepartmentId) {
            referral.toDepartment = targetDepartmentId;
            ticket.department = targetDepartmentId;
            ticket.assignedTo = null;
            ticket.status = 'Open';
        }

        ticket.referralHistory.push(referral);
        await ticket.save();
        res.status(200).json({ message: 'تیکت با موفقیت ارجاع داده شد.', ticket });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Escalate ticket from AI to human
// @route   POST /api/tickets/:id/escalate
// @access  Private (User)
exports.escalateToHuman = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });

        if (!ticket.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'این تیکت متعلق به شما نیست.' });
        }
        
        ticket.status = 'Open';
        await ticket.save();
        notifyOnNewTicket(ticket).catch(err => console.error(err));
        res.status(200).json({ message: 'تیکت شما به کارشناسان انسانی ارجاع داده شد.', ticket });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Resolve a ticket answered by AI
// @route   POST /api/tickets/:id/resolve-ai
// @access  Private (User)
exports.resolveByAi = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });

        if (!ticket.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'این تیکت متعلق به شما نیست.' });
        }

        ticket.status = 'Closed';
        const systemMessage = { senderType: 'system', content: 'این تیکت توسط هوش مصنوعی حل و توسط کاربر تایید شد.', type: 'text' };
        ticket.messages.push(systemMessage);
        await ticket.save();
        res.status(200).json({ message: 'از اینکه بازخورد خود را ثبت کردید متشکریم!', ticket });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// --- AI-related functions for staff ---

// @desc    Get AI-generated summary for a ticket
// @route   GET /api/tickets/:id/summary
// @access  Private (Staff)
exports.getTicketSummary = async (req, res) => {
    try {
        const { role, permissions } = req.user;
        if (role !== 'admin' && !(permissions && permissions.canManageTickets)) {
            return res.status(403).json({ message: 'شما مجوز دسترسی به این بخش را ندارید.' });
        }
        
        const ticket = await Ticket.findById(req.params.id).populate('messages.sender');
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });
        
        const summaryText = await aiService.getSummary(ticket);
        ticket.summary = { content: summaryText, lastUpdated: new Date() };
        await ticket.save();

        res.status(200).json({ summary: summaryText });
    } catch (error) {
        res.status(500).json({ message: 'خطا در تولید خلاصه' });
    }
};

// @desc    Get AI-generated suggestions for a ticket
// @route   GET /api/tickets/:id/suggestions
// @access  Private (Staff)
exports.getTicketSuggestions = async (req, res) => {
    try {
        const { role, permissions } = req.user;
        if (role !== 'admin' && !(permissions && permissions.canManageTickets)) {
            return res.status(403).json({ message: 'شما مجوز دسترسی به این بخش را ندارید.' });
        }

        const ticket = await Ticket.findById(req.params.id).populate('department').populate('messages.sender');
        if (!ticket) return res.status(404).json({ message: 'تیکت یافت نشد.' });

        const suggestions = await aiService.getSuggestions(ticket);
        res.status(200).json({ suggestions });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور برای پیشنهاد پاسخ' });
    }
};