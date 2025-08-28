const mongoose = require('mongoose');
const { Schema } = mongoose;

const faqSchema = new Schema({
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true }
});

const departmentSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    head: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    operators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    faqs: [faqSchema],
    knowledgeBaseText: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;