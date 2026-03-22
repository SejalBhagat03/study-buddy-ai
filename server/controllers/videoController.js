const Video = require('../models/Video');
const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');

// @desc    Get all videos
// @route   GET /api/videos
// @access  Private
const getVideos = asyncHandler(async (req, res, next) => {
    const data = await Video.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(formatResponse(true, 'Videos fetched successfully', data));
});

// @desc    Add a video
// @route   POST /api/videos
// @access  Private
const addVideo = asyncHandler(async (req, res, next) => {
    const data = await Video.create({
        ...req.body,
        user_id: req.user._id
    });
    res.status(201).json(formatResponse(true, 'Video added successfully', data));
});

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private
const deleteVideo = asyncHandler(async (req, res, next) => {
    const data = await Video.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!data) {
        res.status(404);
        throw new Error('Video not found');
    }
    res.status(200).json(formatResponse(true, 'Video deleted successfully', data));
});

module.exports = {
    getVideos,
    addVideo,
    deleteVideo
};

