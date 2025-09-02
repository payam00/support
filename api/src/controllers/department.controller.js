const Department = require('../models/department.model');
const User = require('../models/user.model');

// --- Create Department ---
exports.createDepartment = async (req, res) => {
    try {
        const { name, head, knowledgeBaseText } = req.body;
        if (!name || !head) {
            return res.status(400).json({ message: 'نام دپارتمان و مدیر آن الزامی است.' });
        }
        const headUser = await User.findById(head);
        if (!headUser) {
            return res.status(404).json({ message: 'کاربر مورد نظر برای مدیریت یافت نشد.' });
        }
        const department = await Department.create({ name, head, knowledgeBaseText });
        headUser.role = 'department_head';
        await headUser.save();
        res.status(201).json({ message: 'دپارتمان با موفقیت ایجاد شد.', department });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'دپارتمانی با این نام قبلاً ثبت شده است.' });
        console.error("Error in createDepartment:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// --- Update Department (FIXED) ---
exports.updateDepartment = async (req, res) => {
    try {
        const { name, head, knowledgeBaseText, operators } = req.body; // اپراتورها اضافه شد
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        }

        const originalOperators = new Set(department.operators.map(op => op.toString()));
        const newOperators = new Set(operators || []);

        // 1. تغییر مدیر (Head)
        if (head && department.head.toString() !== head) {
            // Demote the old head if they are not the new head
            await User.findByIdAndUpdate(department.head, { role: 'user' }); 
            const newHeadUser = await User.findByIdAndUpdate(head, { role: 'department_head' });
            if (!newHeadUser) return res.status(404).json({ message: 'کاربر جدید برای مدیریت یافت نشد.' });
            department.head = head;
        }
        
        // 2. به‌روزرسانی اطلاعات اصلی
        if (name) department.name = name;
        if (knowledgeBaseText !== undefined) department.knowledgeBaseText = knowledgeBaseText;

        // 3. مدیریت اپراتورها
        if (operators !== undefined) {
             // کاربرانی که از لیست حذف شده‌اند
            const removedOps = [...originalOperators].filter(opId => !newOperators.has(opId));
            if (removedOps.length > 0) {
                 // TODO: در حالت پیشرفته، باید چک شود که آیا این اپراتورها در دپارتمان دیگری عضو هستند یا خیر
                 // فعلا نقش آنها را به کاربر عادی تغییر می‌دهیم
                await User.updateMany({ _id: { $in: removedOps } }, { role: 'user' });
            }

            // کاربرانی که به لیست اضافه شده‌اند
            const addedOps = [...newOperators].filter(opId => !originalOperators.has(opId));
            if (addedOps.length > 0) {
                await User.updateMany({ _id: { $in: addedOps }, role: 'user' }, { role: 'operator' });
            }
            
            department.operators = operators;
        }

        await department.save();
        
        const updatedDepartment = await Department.findById(req.params.id)
            .populate('head', 'name mobileNumber')
            .populate('operators', 'name mobileNumber');

        res.status(200).json({ message: 'دپارتمان با موفقیت به‌روزرسانی شد.', department: updatedDepartment });
    } catch (error) {
        console.error("Error in updateDepartment:", error);
        if (error.code === 11000) return res.status(409).json({ message: 'دپارتمانی با این نام قبلاً ثبت شده است.' });
        res.status(500).json({ message: 'خطای سرور' });
    }
};
exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find()
            .populate('head', 'name mobileNumber')
            .populate('operators', 'name mobileNumber');
        res.status(200).json(departments);
    } catch (error) {
        console.error("Error in getAllDepartments:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.getMyDepartment = async (req, res) => {
    try {
        const department = await Department.findOne({ head: req.user._id })
            .populate('operators', 'name mobileNumber _id')
            .populate('head', 'name mobileNumber _id');
        if (!department) {
            return res.status(404).json({ message: 'شما مدیر هیچ دپارتمانی نیستید.' });
        }
        res.status(200).json(department);
    } catch (error) {
        console.error("Error in getMyDepartment:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        }
        await User.updateMany({ _id: { $in: [department.head, ...department.operators] } }, { $set: { role: 'user' } });
        await Department.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'دپارتمان با موفقیت حذف شد.' });
    } catch (error) {
        console.error("Error in deleteDepartment:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.addOperatorToDepartment = async (req, res) => {
    try {
        const { mobileNumber } = req.body;
        if (!mobileNumber) return res.status(400).json({ message: 'شماره موبایل اپراتور الزامی است.' });
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        if (department.head.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'شما مجاز به افزودن اپراتور به این دپارتمان نیستید.' });
        }
        const operatorUser = await User.findOne({ mobileNumber });
        if (!operatorUser) return res.status(404).json({ message: 'کاربری با این شماره موبایل یافت نشد.' });

        await Department.updateOne({ _id: req.params.id }, { $addToSet: { operators: operatorUser._id } });
        if (operatorUser.role === 'user') {
            operatorUser.role = 'operator';
            await operatorUser.save();
        }
        res.status(200).json({ message: 'اپراتور با موفقیت به دپارتمان اضافه شد.' });
    } catch (error) {
        console.error("Error in addOperatorToDepartment:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.removeOperatorFromDepartment = async (req, res) => {
    try {
        const { id: departmentId, operatorId } = req.params;
        const department = await Department.findById(departmentId);
        if (!department) return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        if (department.head.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'شما مجاز به حذف اپراتور از این دپارتمان نیستید.' });
        }
        await User.findByIdAndUpdate(operatorId, { role: 'user' });
        await Department.updateOne({ _id: departmentId }, { $pull: { operators: operatorId } });
        res.status(200).json({ message: 'اپراتور با موفقیت از دپارتمان حذف شد.' });
    } catch (error) {
        console.error("Error in removeOperatorFromDepartment:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.addFaq = async (req, res) => {
    try {
        const { question, answer } = req.body;
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        const isHead = department.head.equals(req.user._id);
        if (req.user.role !== 'admin' && !isHead) {
            return res.status(403).json({ message: 'شما مجاز به افزودن سوال به این دپارتمان نیستید.' });
        }
        department.faqs.push({ question, answer });
        await department.save();
        res.status(201).json({ message: 'سوال متداول با موفقیت اضافه شد.', faqs: department.faqs });
    } catch (error) {
        console.error("Error in addFaq:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.getFaqs = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        res.status(200).json(department.faqs);
    } catch (error) {
        console.error("Error in getFaqs:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.updateFaq = async (req, res) => {
    try {
        const { question, answer } = req.body;
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        const isHead = department.head.equals(req.user._id);
        if (req.user.role !== 'admin' && !isHead) {
            return res.status(403).json({ message: 'شما مجاز به ویرایش سوالات این دپارتمان نیستید.' });
        }
        const faq = department.faqs.id(req.params.faqId);
        if (!faq) return res.status(404).json({ message: 'سوال متداول یافت نشد.' });
        faq.question = question;
        faq.answer = answer;
        await department.save();
        res.status(200).json({ message: 'سوال متداول با موفقیت ویرایش شد.' });
    } catch (error) {
        console.error("Error in updateFaq:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.deleteFaq = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: 'دپارتمان یافت نشد.' });
        const isHead = department.head.equals(req.user._id);
        if (req.user.role !== 'admin' && !isHead) {
            return res.status(403).json({ message: 'شما مجاز به حذف سوالات این دپارتمان نیستید.' });
        }
        const faq = department.faqs.id(req.params.faqId);
        if (!faq) return res.status(404).json({ message: 'سوال متداول یافت نشد.' });
        faq.remove();
        await department.save();
        res.status(200).json({ message: 'سوال متداول با موفقیت حذف شد.' });
    } catch (error) {
        console.error("Error in deleteFaq:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};