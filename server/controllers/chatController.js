const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');
const { generateChatFromAI, generateSuggestionsFromAI } = require('../services/aiService');


// @desc    Generate AI Chat response
// @route   POST /api/chat
// @access  Private
const generateChatResponse = asyncHandler(async (req, res, next) => {
    const { messages, studyContent, mode } = req.body;

    try {
        const aiText = await generateChatFromAI(messages || [], studyContent || "");
        res.status(200).json(formatResponse(true, 'Chat response generated', { message: aiText }));
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json(formatResponse(false, error.message || 'AI Generation failed'));
    }
});

// @desc    Generate AI suggestions
// @route   POST /api/chat/suggestions
// @access  Private
const generateSuggestions = asyncHandler(async (req, res, next) => {
    const { content } = req.body;
    if (!content) {
        return res.status(200).json(formatResponse(true, 'No content provided', []));
    }

    try {
        const suggestions = await generateSuggestionsFromAI(content);
        res.status(200).json(formatResponse(true, 'Suggestions generated', suggestions));
    } catch (error) {
        console.error("Suggestions Error:", error);
        res.status(500).json(formatResponse(false, error.message || 'Failed to generate suggestions'));
    }
});

module.exports = {
    generateChatResponse,
    generateSuggestions
};

