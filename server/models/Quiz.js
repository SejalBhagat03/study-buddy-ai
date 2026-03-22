const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    score: {
        type: Number,
        default: 0
    },
    total_questions: {
        type: Number,
        default: 0
    },
    questions: {
        type: Array, // Array of { question, options, answer }
        default: []
    },
    completed_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);
