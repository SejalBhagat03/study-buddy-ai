const { generateSummaryFromAI } = require('../services/aiService');
const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');

// @desc    Generate summary from AI
// @route   POST /api/summaries/generate
// @access  Private
const generateSummary = asyncHandler(async (req, res, next) => {
    const { content, title } = req.body;
    if (!content) {
        return res.status(400).json(formatResponse(false, 'Content is required for summary'));
    }

    try {
        const summary = await generateSummaryFromAI(content, title);
        res.status(200).json(formatResponse(true, 'Summary generated successfully', summary));
    } catch (error) {
        console.error("Summary Generation Error:", error);
        res.status(500).json(formatResponse(false, error.message || 'Failed to generate summary'));
    }
});

module.exports = {
    generateSummary
};
