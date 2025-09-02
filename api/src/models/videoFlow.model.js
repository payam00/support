const mongoose = require('mongoose');
const { Schema } = mongoose;

// اسکیما برای هر دکمه سوال که زیر ویدیو نمایش داده می‌شود
const questionSchema = new Schema({
    // متن روی دکمه
    text: {
        type: String,
        required: true,
    },
    // ID مرحله بعدی که با کلیک روی این سوال، کاربر به آن هدایت می‌شود
    nextFlow: {
        type: Schema.Types.ObjectId,
        ref: 'VideoFlow',
        required: true,
    }
});

const videoFlowSchema = new Schema({
    // نام مرحله برای شناسایی آسان در پنل ادمین
    name: {
        type: String,
        required: true,
        trim: true,
    },
    // آدرس کامل ویدیویی که در این مرحله پخش می‌شود
    videoUrl: {
        type: String,
        required: true,
    },
    // آدرس ویدیو کوتاه (۵ ثانیه‌ای) برای پیش‌نمایش در ویجت بسته
    // این فیلد معمولاً فقط برای مرحله ریشه (isRoot: true) استفاده می‌شود
    previewVideoUrl: {
        type: String,
    },
    // شماره تماس اصلی که در ویجت بسته نمایش داده می‌شود
    // این فیلد نیز معمولاً فقط برای مرحله ریشه (isRoot: true) استفاده می‌شود
    ctaPhoneNumber: {
        type: String,
        trim: true,
    },
    // اگر true باشد، این مرحله به عنوان نقطه شروع ویجت در نظر گرفته می‌شود
    isRoot: {
        type: Boolean,
        default: false,
        index: true,
    },
    // لیست سوالات (دکمه‌ها) که بعد از این ویدیو نمایش داده می‌شوند
    questions: [questionSchema],
    
    // اگر این فیلد true باشد و لیست سوالات خالی باشد، دکمه فرم مشاوره در انتهای فلو نمایش داده می‌شود
    ctaFormEnabled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const VideoFlow = mongoose.model('VideoFlow', videoFlowSchema);

module.exports = VideoFlow;