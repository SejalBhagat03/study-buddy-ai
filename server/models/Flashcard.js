const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chapter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
        required: false
    },
    deck_name: {
        type: String,
        required: [true, 'Please add a deck name']
    },
    front: {
        type: String,
        required: [true, 'Please add a front card prompt']
    },
    back: {
        type: String,
        required: [true, 'Please add a back card answer']
    },
    difficulty: {
        type: Number,
        default: 1
    },
    review_count: {
        type: Number,
        default: 0
    },
    next_review: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
