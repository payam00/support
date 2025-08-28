const Invoice = require('../models/invoice.model');
const ClassType = require('../models/classType.model');
const Setting = require('../models/setting.model'); 
const { sendPatternSms } = require('../services/sms.service');
const json2csv = require('json2csv').parse;

// @desc    Create an invoice
exports.createInvoice = async (req, res) => {
    try {
        // Permission Check
        if (!req.user.permissions.canCreateInvoice && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'شما مجوز صدور فاکتور را ندارید.' });
        }
        
        const { fullName, nationality, nationalId, mobileNumber, classTypeId, amount } = req.body;
        
        if (nationality === 'iranian' && !nationalId) {
            return res.status(400).json({ message: 'کد ملی برای اتباع ایرانی الزامی است.' });
        }

        const classType = await ClassType.findById(classTypeId);
        if (!classType) {
            return res.status(404).json({ message: 'نوع کلاس انتخاب شده معتبر نیست.' });
        }

        const settings = await Setting.findOne();
        const validityHours = settings ? settings.invoiceValidityHours : 24; // Use default if settings not found

        const invoice = await Invoice.create({
            fullName,
            nationality,
            nationalId,
            mobileNumber,
            classType: classTypeId,
            amount: amount || classType.price,
            finalAmount: amount || classType.price,
            createdBy: req.user._id,
            expiresAt: new Date(Date.now() + validityHours * 3600 * 1000),
        });

        res.status(201).json({ message: 'فاکتور با موفقیت صادر شد.', invoice });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: 'خطای سرور', error: error.message });
    }
};

// @desc    Get all invoices (for staff)
exports.getInvoices = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        // Permission Filter
        if (!req.user.permissions.canViewAllInvoices && req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        // Status Filter
        if (status && ['pending', 'paid', 'canceled', 'expired'].includes(status)) {
            query.status = status;
        }

        // Search Filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } },
                { nationalId: { $regex: search, $options: 'i' } }
            ];
        }

        const invoices = await Invoice.find(query)
            .populate('createdBy', 'name')
            .populate('classType', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Get single invoice by public token
exports.getInvoiceByToken = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ uniqueToken: req.params.token })
            .populate('classType', 'name price termsAndConditions');
            
        if (!invoice) {
            return res.status(404).json({ message: 'فاکتور مورد نظر یافت نشد.' });
        }
        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};
// @desc    Send invoice link via SMS
// @route   POST /api/invoices/:id/send-sms
// @access  Private (Staff)
exports.sendInvoiceSms = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'فاکتور یافت نشد.' });
        }

        const { checkCooldown } = req.body; // To differentiate between modal and list actions

        // Check for 1-hour cooldown if requested
        if (checkCooldown && invoice.lastSmsSentAt) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (new Date(invoice.lastSmsSentAt) > oneHourAgo) {
                return res.status(429).json({ message: 'برای ارسال مجدد پیامک از این طریق، باید یک ساعت صبر کنید.' });
            }
        }
        
        const patternCode = process.env.IPPANEL_INVOICE_PATTERN_CODE;
        if (!patternCode) {
            return res.status(500).json({ message: 'کد پترن پیامک در سرور تعریف نشده است.' });
        }

        const variables = {
            token: invoice.uniqueToken,
        };

        await sendPatternSms(patternCode, invoice.mobileNumber, variables);

        // Update the last sent time
        invoice.lastSmsSentAt = new Date();
        await invoice.save();

        res.status(200).json({ message: 'پیامک با موفقیت ارسال شد.' });

    } catch (error) {
        console.error("Send SMS Error:", error);
        res.status(500).json({ message: 'خطا در ارسال پیامک' });
    }
};

// @desc    Export invoices to CSV
exports.exportInvoices = async (req, res) => {
    try {
        // We can reuse the same filtering logic as getInvoices
        const { search, status } = req.query;
        let query = {};
        if (!req.user.permissions.canViewAllInvoices && req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }
        if (status && ['pending', 'paid', 'canceled', 'expired'].includes(status)) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const invoices = await Invoice.find(query)
            .populate('createdBy', 'name')
            .populate('classType', 'name')
            .sort({ createdAt: -1 });

        const fields = [
            { label: 'نام مشتری', value: 'fullName' },
            { label: 'موبایل', value: 'mobileNumber' },
            { label: 'نوع کلاس', value: 'classType.name' },
            { label: 'مبلغ نهایی', value: 'finalAmount' },
            { label: 'وضعیت', value: 'status' },
            { label: 'صادر کننده', value: 'createdBy.name' },
            { label: 'تاریخ صدور', value: 'createdAt' },
        ];
        
        const csv = json2csv(invoices, { fields });
        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment('invoices.csv');
        // Add BOM for Excel to recognize UTF-8
        res.send('\uFEFF' + csv);
    } catch (error) {
        res.status(500).json({ message: 'خطا در ایجاد خروجی' });
    }
};