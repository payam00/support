const mongoose = require('mongoose');
const { Schema } = mongoose;

const announcementSchema = new Schema({
    title: {
        type: String,
        required: [true, 'عنوان اطلاعیه الزامی است.'],
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'محتوای اطلاعیه الزامی است.'],
    },
    type: {
        type: String,
        enum: ['success', 'info', 'warning', 'error'],
        default: 'info',
    },
    // --- NEW FIELD for Role-Based Announcements ---
    targetRoles: {
        type: [{
            type: String,
            enum: ['user', 'operator', 'department_head', 'admin']
        }],
        default: [] // Empty array means visible to all roles
    },
    // ---------------------------------------------
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true
});

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;