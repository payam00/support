const axios = require('axios');
const Setting = require('../models/setting.model');
const Invoice = require('../models/invoice.model');
const Discount = require('../models/discount.model');

// --- Configurations ---
const ZARINPAL_API_REQUEST = 'https://api.zarinpal.com/pg/v4/payment/request.json';
const ZARINPAL_API_VERIFY = 'https://api.zarinpal.com/pg/v4/payment/verify.json';
const ZARINPAL_START_PAY = 'https://www.zarinpal.com/pg/StartPay/';
const PAYPING_API_REQUEST_V3 = 'https://api.payping.ir/v3/pay';
const PAYPING_API_VERIFY_V3 = 'https://api.payping.ir/v3/pay/verify';

// selectGateway and initiatePayment functions remain correct from the previous version
async function selectGateway() {
    const settings = await Setting.findOne();
    if (!settings) throw new Error('تنظیمات سیستم یافت نشد.');
    const { gatewaySelectionStrategy, paymentGateways } = settings;
    const { zarinpal, payping } = paymentGateways;
    const availableGateways = [];
    if (zarinpal && zarinpal.enabled) availableGateways.push('zarinpal');
    if (payping && payping.enabled) availableGateways.push('payping');
    if (availableGateways.length === 0) throw new Error('هیچ درگاه پرداخت فعالی در سیستم تعریف نشده است.');
    switch (gatewaySelectionStrategy) {
        case 'zarinpal_only':
            if (!zarinpal || !zarinpal.enabled) throw new Error('درگاه انتخابی (زرین‌پال) فعال نیست.');
            return 'zarinpal';
        case 'payping_only':
            if (!payping || !payping.enabled) throw new Error('درگاه انتخابی (پی‌پینگ) فعال نیست.');
            return 'payping';
        case 'random':
        default:
            return availableGateways[Math.floor(Math.random() * availableGateways.length)];
    }
}

exports.initiatePayment = async (invoiceToken) => {
    const invoice = await Invoice.findOne({ uniqueToken: invoiceToken });
    if (!invoice || invoice.status !== 'pending') throw new Error('فاکتور نامعتبر است.');
    if (new Date(invoice.expiresAt) < new Date()) {
        invoice.status = 'expired';
        await invoice.save();
        throw new Error('این فاکتور منقضی شده است.');
    }
    const selectedGateway = await selectGateway();
    const amount = invoice.finalAmount;
    const callbackURL = `${process.env.API_BASE_URL}/api/payment/callback`;
    const description = `پرداخت فاکتور شماره ${invoice._id.toString().slice(-6)}`;
    try {
        if (selectedGateway === 'zarinpal') {
            const merchantId = process.env.ZARINPAL_MERCHANT_ID;
            if (!merchantId) throw new Error('مرچنت کد زرین‌پال تعریف نشده است.');
            const response = await axios.post(ZARINPAL_API_REQUEST, { merchant_id: merchantId, amount, callback_url: callbackURL, description, metadata: { mobile: invoice.mobileNumber } });
            if (response.data.data.code === 100) {
                invoice.paymentGateway = 'zarinpal';
                invoice.paymentAuthority = response.data.data.authority;
                await invoice.save();
                return `${ZARINPAL_START_PAY}${response.data.data.authority}`;
            } else { throw new Error(`خطا در اتصال به زرین‌پال: ${response.data.errors.message}`); }
        } else if (selectedGateway === 'payping') {
            const authToken = process.env.PAYPING_AUTH_TOKEN;
            if (!authToken) throw new Error('توکن پی‌پینگ تعریف نشده است.');
            const headers = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
            const response = await axios.post(PAYPING_API_REQUEST_V3, { amount, returnUrl: callbackURL, description, clientRefId: invoice.uniqueToken }, { headers });
            if (response.data && response.data.url) {
                invoice.paymentGateway = 'payping';
                invoice.paymentAuthority = response.data.paymentCode;
                await invoice.save();
                return response.data.url;
            } else { throw new Error('پاسخ دریافتی از پی‌پینگ نامعتبر است.'); }
        }
    } catch (error) {
        if (error.response) {
            console.error('Gateway Error:', error.response.data);
            const errorTitle = error.response.data.title || 'خطای درگاه پرداخت';
            const errorDetails = error.response.data.metaData ? JSON.stringify(error.response.data.metaData.errors) : 'جزئیات بیشتر در لاگ سرور موجود است.';
            throw new Error(`${errorTitle}: ${errorDetails}`);
        }
        throw new Error(error.message);
    }
};


// --- FINAL AND MOST ROBUST verifyPayment function ---
exports.verifyPayment = async (queryParams) => {
    const { Authority, Status, clientRefId, paymentCode, paymentRefId } = queryParams;
    let invoice;

    console.log("Callback received with params:", queryParams); // Added for debugging

    // Handle transaction cancellation by user
    if (Status && Status !== 'OK') { // Zarinpal cancellation
        invoice = await Invoice.findOne({ paymentGateway: 'zarinpal', paymentAuthority: Authority });
        if (invoice) {
            invoice.status = 'canceled';
            await invoice.save();
        }
        throw new Error('تراکنش توسط کاربر لغو شد.');
    }

    try {
        if (Authority && Status === 'OK') { // Zarinpal Success
            invoice = await Invoice.findOne({ paymentGateway: 'zarinpal', paymentAuthority: Authority });
            if (!invoice) throw new Error('فاکتور مربوط به این تراکنش زرین‌پال یافت نشد.');

            const merchantId = process.env.ZARINPAL_MERCHANT_ID;
            console.log(`Verifying Zarinpal for Authority: ${Authority} with Amount: ${invoice.finalAmount}`); // Added for debugging
            
            const response = await axios.post(ZARINPAL_API_VERIFY, {
                merchant_id: merchantId,
                amount: invoice.finalAmount,
                authority: Authority,
            });

            console.log("Zarinpal Verify Response:", response.data); // Added for debugging

            if (response.data.data.code === 100 || response.data.data.code === 101) {
                invoice.paymentRefId = response.data.data.ref_id;
            } else {
                // If verification fails, we should NOT change status to paid
                throw new Error(`تایید تراکنش زرین‌پال ناموفق بود. کد خطا: ${response.data.data.code}`);
            }

        } else if (clientRefId && paymentCode && paymentRefId) { // PayPing V3 Success
            invoice = await Invoice.findOne({ paymentGateway: 'payping', uniqueToken: clientRefId });
            if (!invoice) throw new Error('فاکتور مربوط به این تراکنش پی‌پینگ یافت نشد.');
            if (invoice.paymentAuthority !== paymentCode) throw new Error('کد پرداخت مطابقت ندارد.');

            const authToken = process.env.PAYPING_AUTH_TOKEN;
            const headers = { 'Authorization': `Bearer ${authToken}` };
            console.log(`Verifying PayPing for Code: ${paymentCode} with Amount: ${invoice.finalAmount}`); // Added for debugging

            const response = await axios.post(PAYPING_API_VERIFY_V3, {
                paymentRefId,
                paymentCode,
                amount: invoice.finalAmount,
            }, { headers });
            
            console.log("PayPing Verify Response Status:", response.status); // Added for debugging

            if (response.status === 200) {
                 invoice.paymentRefId = paymentRefId; // <-- FIX: was refId, changed to paymentRefId
            } else {
                throw new Error('تایید تراکنش پی‌پینگ ناموفق بود.');
            }

        } else {
            // This catches PayPing cancellations and any other invalid callback
            throw new Error('پارامترهای بازگشتی از درگاه نامعتبر است یا کاربر تراکنش را لغو کرده است.');
        }

        // This code now only runs if verification was successful
        invoice.status = 'paid';
        await invoice.save();

        if (invoice.discount && invoice.discount.code) {
            await Discount.updateOne({ code: invoice.discount.code }, { $inc: { timesUsed: 1 } });
        }

        return invoice;

    } catch (error) {
        // This catch block will now handle failed verifications as well
        console.error("Verification Error:", error.message);
        // We re-throw the error so the controller redirects to the failed page
        throw error;
    }
};