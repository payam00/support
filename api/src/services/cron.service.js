const cron = require('node-cron');
const Ticket = require('../models/ticket.model');

// این تابع منطق اصلی بستن تیکت‌های قدیمی را دارد
const closeOldAnsweredTickets = async () => {
    console.log('Cron job is running: Checking for old answered tickets...');
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await Ticket.updateMany(
            {
                status: 'Answered', // فقط تیکت‌های با وضعیت "پاسخ داده شده"
                updatedAt: { $lt: twentyFourHoursAgo } // که آخرین آپدیت آن‌ها قبل از ۲۴ ساعت پیش بوده
            },
            {
                $set: { status: 'Closed' }, // وضعیت آن‌ها را به "بسته شده" تغییر بده
                $push: { // یک پیام سیستمی برای اطلاع‌رسانی اضافه کن
                    messages: {
                        senderType: 'system',
                        content: 'این تیکت به دلیل عدم پاسخ کاربر پس از ۲۴ ساعت به صورت خودکار بسته شد.',
                        type: 'text'
                    }
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`Successfully closed ${result.modifiedCount} old tickets.`);
        } else {
            console.log('No old answered tickets to close.');
        }

    } catch (error) {
        console.error('Error running cron job to close old tickets:', error);
    }
};

// تابع اصلی که cron job را زمان‌بندی و اجرا می‌کند
const startTicketCloserJob = () => {
    // این کد هر ساعت یک‌بار اجرا می‌شود ('0 * * * *')
    cron.schedule('0 * * * *', closeOldAnsweredTickets, {
        scheduled: true,
        timezone: "Asia/Tehran"
    });

    console.log('✅ Cron job for closing old tickets has been scheduled to run every hour.');
};

module.exports = { startTicketCloserJob };