const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    senderType: {
        type: String,
        required: true,
        enum: ['user', 'operator', 'ai', 'system']
    },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'voice'], default: 'text' },
    voiceDuration: { type: Number },
    timestamp: { type: Date, default: Date.now }
});

const referralSchema = new Schema({
     referredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fromDepartment: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    toDepartment: { type: Schema.Types.ObjectId, ref: 'Department' }, // برای ارجاع به دپارتمان دیگر
    note: { type: String, required: true },
    referredAt: { type: Date, default: Date.now }
});

const ticketSchema = new Schema({
    title: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['Awaiting AI', 'Answered by AI', 'Open', 'Answered', 'In-Progress', 'Closed', 'Referred'],
        default: 'Awaiting AI'
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    messages: [messageSchema],
    summary: { content: { type: String }, lastUpdated: { type: Date } },
    referralHistory: [referralSchema]
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;