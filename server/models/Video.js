const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    url: {
        type: String,
        required: [true, 'Please add a YouTube URL']
    },
    transcript: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);
