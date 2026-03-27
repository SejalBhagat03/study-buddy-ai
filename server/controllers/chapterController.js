const { getChaptersByUserId, createChapter } = require('../services/chapterService');
const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');
// @desc    Get all chapters
// @route   GET /api/chapters
// @access  Private
const getChapters = asyncHandler(async (req, res, next) => {
    const data = await getChaptersByUserId(req.user._id);
    res.status(200).json(formatResponse(true, 'Chapters fetched successfully', data));
});

// @desc    Create a chapter
// @route   POST /api/chapters
// @access  Private
const addChapter = asyncHandler(async (req, res, next) => {
    const data = await createChapter(req.user._id, req.body);
    res.status(201).json(formatResponse(true, 'Chapter created successfully', data));
});
module.exports = {
    getChapters,
    addChapter
};
