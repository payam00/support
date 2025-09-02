const mongoose = require('mongoose');
const { Schema } = mongoose;

const learningSchema = new Schema({
    ticketSummary: { type: String, required: true },
    successfulReply: { type: String, required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' }
}, { timestamps: true });

const Learning = mongoose.model('Learning', learningSchema);
module.exports = Learning;