const { sendPatternSms } = require('./sms.service');
const { sendTelegramNotification } = require('./telegram.service');
const Department = require('../models/department.model');
const User = require('../models/user.model');

/**
 * Sends OTP SMS to user
 */
const notifyOnOtpRequest = async (mobileNumber, otp) => {
    try {
        await sendPatternSms(
            process.env.IPPANEL_OTP_PATTERN_CODE,
            mobileNumber,
            { "verification-code": otp }
        );
    } catch (error) {
        console.error("Error in notifyOnOtpRequest:", error);
    }
    console.log(otp)
};

/**
 * Sends SMS & Telegram notifications when a new ticket is created.
 */
const notifyOnNewTicket = async (ticket) => {
    try {
        const populatedTicket = await ticket.populate([
            { path: 'department', select: 'name operators' },
            { path: 'createdBy', select: 'name' }
        ]);

        const { _id, title, department, createdBy } = populatedTicket;

        // 1. Telegram
        const telegramMessage = `
*تیکت جدید ثبت شد!* 🔔
*عنوان:* ${title}
*دپارتمان:* ${department.name}
*ایجاد شده توسط:* ${createdBy.name}
*شماره تیکت:* \`${_id}\`
        `;
        await sendTelegramNotification(telegramMessage);

        // 2. SMS
        if (department.operators?.length > 0) {
            const operators = await User.find({ '_id': { $in: department.operators } }).select('mobileNumber');

            for (const operator of operators) {
                if (operator.mobileNumber) {
                    await sendPatternSms(
                        process.env.IPPANEL_NEW_TICKET_PATTERN_CODE,
                        operator.mobileNumber,
                        {
                            title: title,
                            id: _id.toString()
                        }
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error in notifyOnNewTicket:", error);
    }
};

/**
 * Sends SMS notification to user when operator replies to ticket
 */
const notifyOnOperatorReply = async (ticket) => {
    try {
        const populatedTicket = await ticket.populate('createdBy', 'name mobileNumber');
        const { createdBy } = populatedTicket;

        if (!createdBy?.mobileNumber) {
            console.error('Notification failed: Ticket creator or mobile number not found.');
            return;
        }

        await sendPatternSms(
            process.env.IPPANEL_TICKET_REPLIED_PATTERN_CODE,
            createdBy.mobileNumber,
            { name: createdBy.name || 'کاربر گرامی' }
        );
    } catch (error) {
        console.error("Error in notifyOnOperatorReply:", error);
    }
};

module.exports = {
    notifyOnOtpRequest,
    notifyOnNewTicket,
    notifyOnOperatorReply
};
