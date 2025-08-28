const Discount = require('../models/discount.model');
const Invoice = require('../models/invoice.model');
const { nanoid } = require('nanoid');
const json2csv = require('json2csv').parse;

// getDiscounts, createDiscount, createBulkDiscounts, bulkUpdateDiscounts, applyDiscount functions remain the same...
exports.getDiscounts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const discounts = await Discount.find().skip(skip).limit(limit).sort({ createdAt: -1 });
        const total = await Discount.countDocuments();
        res.status(200).json({ discounts, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

exports.createDiscount = async (req, res) => {
    try {
        const { code, type, value, usageLimit, expiresAt } = req.body;
        const newDiscount = await Discount.create({ code: code.toUpperCase(), type, value, usageLimit, expiresAt });
        res.status(201).json(newDiscount);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'این کد تخفیف قبلاً ثبت شده است.' });
        }
        res.status(500).json({ message: 'خطای سرور', error: error.message });
    }
};

exports.createBulkDiscounts = async (req, res) => {
    try {
        const { count, type, value, usageLimit, expiresAt, prefix } = req.body;
        if (!count || count <= 0 || count > 500) {
            return res.status(400).json({ message: 'تعداد کدها باید بین ۱ تا ۵۰۰ باشد.' });
        }
        const discountsToCreate = [];
        for (let i = 0; i < count; i++) {
            const randomPart = nanoid(8).toUpperCase();
            const code = prefix ? `${prefix.toUpperCase()}-${randomPart}` : randomPart;
            discountsToCreate.push({ code, type, value, usageLimit, expiresAt: expiresAt ? new Date(expiresAt) : null });
        }
        const createdDiscounts = await Discount.insertMany(discountsToCreate);
        const fields = ['code', 'type', 'value', 'usageLimit', 'expiresAt'];
        const csv = json2csv(createdDiscounts, { fields });
        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(`discounts-${Date.now()}.csv`);
        res.status(201).send('\uFEFF' + csv);
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور هنگام ساخت کدهای گروهی' });
    }
};

exports.bulkUpdateDiscounts = async (req, res) => {
    try {
        const { ids, action, payload } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'هیچ کد تخفیفی انتخاب نشده است.' });
        }
        if (action === 'delete') {
            const result = await Discount.deleteMany({ _id: { $in: ids } });
            return res.status(200).json({ message: `${result.deletedCount} کد تخفیف با موفقیت حذف شد.` });
        }
        if (action === 'update') {
            if (!payload || Object.keys(payload).length === 0) {
                return res.status(400).json({ message: 'هیچ تغییری برای اعمال مشخص نشده است.' });
            }
            const updateData = {};
            if (payload.usageLimit !== undefined) updateData.usageLimit = payload.usageLimit;
            if (payload.expiresAt !== undefined) updateData.expiresAt = payload.expiresAt;
            if (payload.isActive !== undefined) updateData.isActive = payload.isActive;
            const result = await Discount.updateMany({ _id: { $in: ids } }, { $set: updateData });
            return res.status(200).json({ message: `${result.modifiedCount} کد تخفیف با موفقیت ویرایش شد.` });
        }
        return res.status(400).json({ message: 'عملیات مشخص شده نامعتبر است.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در انجام عملیات گروهی' });
    }
};

exports.applyDiscount = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'کد تخفیف الزامی است.' });
        const discount = await Discount.findOne({ code: code.toUpperCase(), isActive: true });
        if (!discount) return res.status(404).json({ message: 'کد تخفیف نامعتبر است.' });
        if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return res.status(400).json({ message: 'این کد تخفیف منقضی شده است.' });
        if (discount.timesUsed >= discount.usageLimit) return res.status(400).json({ message: 'ظرفیت استفاده از این کد تخفیف به اتمام رسیده است.' });
        
        let invoice = await Invoice.findOne({ uniqueToken: req.params.token });
        if (!invoice) return res.status(404).json({ message: 'فاکتور یافت نشد.' });
        if (invoice.status !== 'pending') return res.status(400).json({ message: 'امکان اعمال تخفیف روی این فاکتور وجود ندارد.' });
        
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = Math.round((invoice.amount * discount.value) / 100);
        } else {
            discountAmount = discount.value;
        }
        invoice.finalAmount = Math.max(0, invoice.amount - discountAmount);
        invoice.discount = { code: discount.code, amount: discountAmount };
        
        await invoice.save();
        // Re-populate to send full data back to frontend
        invoice = await Invoice.findById(invoice._id).populate('classType', 'name price termsAndConditions');

        res.status(200).json({ message: 'تخفیف با موفقیت اعمال شد.', invoice });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// --- FINAL AND CORRECTED removeDiscount function ---
exports.removeDiscount = async (req, res) => {
    try {
        let invoice = await Invoice.findOne({ uniqueToken: req.params.token });
        if (!invoice) {
            return res.status(404).json({ message: 'فاکتور یافت نشد.' });
        }
        if (invoice.status !== 'pending') {
            return res.status(400).json({ message: 'امکان تغییر در این فاکتور وجود ندارد.' });
        }

        // Reset discount fields
        invoice.finalAmount = invoice.amount;
        invoice.discount = undefined;

        await invoice.save();

        // --- FIX: Re-populate the classType details before sending the response ---
        invoice = await Invoice.findById(invoice._id).populate('classType', 'name price termsAndConditions');
        // --------------------------------------------------------------------------

        res.status(200).json({ message: 'تخفیف با موفقیت حذف شد.', invoice });

    } catch (error) {
        console.error("Remove Discount Error:", error);
        res.status(500).json({ message: 'خطای سرور' });
    }
};