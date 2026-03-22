const { getQuizzesByUserId, createQuiz } = require('../services/quizService');
const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');

const { generateQuizFromAI } = require('../services/aiService');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
const getQuizzes = asyncHandler(async (req, res, next) => {
    const data = await getQuizzesByUserId(req.user._id);
    res.status(200).json(formatResponse(true, 'Quizzes fetched successfully', data));
});

// @desc    Add a quiz
// @route   POST /api/quizzes
// @access  Private
const addQuiz = asyncHandler(async (req, res, next) => {
    const data = await createQuiz(req.user._id, {
        ...req.body,
        // Ensure options list contains direct mapping values
    });
    
    // Increment study minutes
    req.user.todayCompletedMinutes = (req.user.todayCompletedMinutes || 0) + 15;
    await req.user.save();

    res.status(201).json(formatResponse(true, 'Quiz created successfully', data));
});

// @desc    Generate quiz from AI
// @route   POST /api/quizzes/generate
// @access  Private
const generateQuiz = asyncHandler(async (req, res, next) => {
    const { content, count } = req.body;
    if (!content) {
        res.status(400);
        throw new Error('Please provide content to generate quiz');
    }

    const questions = await generateQuizFromAI(content, count || 5);
    res.status(200).json(formatResponse(true, 'Quiz generated successfully', questions));
});

module.exports = {
    getQuizzes,
    addQuiz,
    generateQuiz
};

