const Invoice = require('../models/invoice.model');
const ClassType = require('../models/classType.model');
const Setting = require('../models/setting.model');
const { sendPatternSms } = require('../services/sms.service');
const json2csv = require('json2csv').parse;

// @desc    Create an invoice
exports.createInvoice = async (req, res) => {
    try {
        if (!req.user.permissions.canCreateInvoice && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'شما مجوز صدور فاکتور را ندارید.' });
        }
        
        // --- Add allowDiscount to destructuring ---
        const { fullName, nationality, nationalId, mobileNumber, classTypeId, amount, allowDiscount } = req.body;
        
        if (nationality === 'iranian' && !nationalId) {
            return res.status(400).json({ message: 'کد ملی برای اتباع ایرانی الزامی است.' });
        }
        const classType = await ClassType.findById(classTypeId);
        if (!classType) {
            return res.status(404).json({ message: 'نوع کلاس انتخاب شده معتبر نیست.' });
        }
        const settings = await Setting.findOne();
        const validityHours = settings ? settings.invoiceValidityHours : 24;

        let newInvoice = await Invoice.create({
            fullName, nationality, nationalId, mobileNumber, classType: classTypeId,
            amount: amount || classType.price,
            finalAmount: amount || classType.price,
            allowDiscount: allowDiscount || false, // Save the new field
            createdBy: req.user._id,
            expiresAt: new Date(Date.now() + validityHours * 3600 * 1000),
        });

        const populatedInvoice = await Invoice.findById(newInvoice._id)
            .populate('createdBy', 'name')
            .populate('classType');

        res.status(201).json({ message: 'فاکتور با موفقیت صادر شد.', invoice: populatedInvoice });

    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: 'خطای سرور', error: error.message });
    }
};

// @desc    Get all invoices (for staff)
exports.getInvoices = async (req, res) => {
    try {
        const { search, status, createdBy } = req.query;
        let query = {};
        if (!req.user.permissions.canViewAllInvoices && req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }
        if (status && ['pending', 'paid', 'canceled', 'expired'].includes(status)) {
            query.status = status;
        }
        if (createdBy) {
            query.createdBy = createdBy;
        }
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
            .populate('createdBy', 'name')
            .populate('classType', 'name price termsAndConditions');
        if (!invoice) {
            return res.status(404).json({ message: 'فاکتور مورد نظر یافت نشد.' });
        }
        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// @desc    Export invoices to CSV
exports.exportInvoices = async (req, res) => {
    try {
        let query = {}; // Build query based on permissions and filters
        const invoices = await Invoice.find(query)
            .populate('createdBy', 'name')
            .populate('classType', 'name');
        const fields = [ /* ... fields for CSV ... */ ];
        const csv = json2csv(invoices, { fields });
        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment('invoices.csv');
        res.send('\uFEFF' + csv);
    } catch (error) {
        res.status(500).json({ message: 'خطا در ایجاد خروجی' });
    }
};

// @desc    Send invoice link via SMS
exports.sendInvoiceSms = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'فاکتور یافت نشد.' });
        }
        const { checkCooldown } = req.body;
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
        const variables = { token: invoice.uniqueToken };
        await sendPatternSms(patternCode, invoice.mobileNumber, variables);
        invoice.lastSmsSentAt = new Date();
        await invoice.save();
        res.status(200).json({ message: 'پیامک با موفقیت ارسال شد.' });
    } catch (error) {
        console.error("Send SMS Error:", error);
        res.status(500).json({ message: 'خطا در ارسال پیامک' });
    }
};