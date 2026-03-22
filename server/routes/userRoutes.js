const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const formatResponse = require('../utils/formatResponse');
const router = express.Router();

const Quiz = require('../models/Quiz');
const Flashcard = require('../models/Flashcard');
const Note = require('../models/Note');
const Chapter = require('../models/Chapter');

// @desc    Get user profile with stats
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const quizCount = await Quiz.countDocuments({ user_id: req.user._id });
        const flashcardCount = await Flashcard.countDocuments({ user_id: req.user._id });
        const noteCount = await Note.countDocuments({ user_id: req.user._id });
        const chapterCount = await Chapter.countDocuments({ user_id: req.user._id });

        res.status(200).json(formatResponse(true, 'Profile fetched successfully', {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            stats: {
                totalQuizzes: quizCount,
                totalFlashcards: flashcardCount,
                totalNotes: noteCount,
                totalChapters: chapterCount
            },
            streak: {
                currentStreak: req.user.currentStreak || 0,
                longestStreak: req.user.longestStreak || 0,
                todayCompletedMinutes: req.user.todayCompletedMinutes || 0
            }
        }));
    } catch (error) {
        res.status(500).json(formatResponse(false, 'Failed to fetch profile stats'));
    }
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { fullName } = req.body;
        if (fullName) req.user.name = fullName;
        
        await req.user.save();
        
        res.status(200).json(formatResponse(true, 'Profile updated successfully', {
            name: req.user.name
        }));
    } catch (error) {
        res.status(500).json(formatResponse(false, 'Failed to update profile'));
    }
});

// @desc    Get user streak stats
// @route   GET /api/user/streak
// @access  Private
router.get('/streak', protect, (req, res) => {

    res.status(200).json(formatResponse(true, 'Streak stats fetched', {
        currentStreak: req.user.currentStreak || 1,
        longestStreak: req.user.longestStreak || 1,
        lastStudyDate: req.user.lastStudyDate || new Date().toISOString().split('T')[0],
        todayGoalMinutes: 30,
        todayCompletedMinutes: req.user.todayCompletedMinutes || 0
    }));
});


module.exports = router;

