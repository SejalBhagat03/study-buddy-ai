const { getFlashcardsByUserId, createFlashcard } = require('../services/flashcardService');
const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');
const { generateFlashcardsFromAI } = require('../services/aiService');

// @desc    Get all flashcards
// @route   GET /api/flashcards
// @access  Private
const getFlashcards = asyncHandler(async (req, res, next) => {
    const data = await getFlashcardsByUserId(req.user._id);
    res.status(200).json(formatResponse(true, 'Flashcards fetched successfully', data));
});

const addFlashcard = asyncHandler(async (req, res, next) => {
    const Flashcard = require('../models/Flashcard'); // inline or import

    if (Array.isArray(req.body)) {
        const cards = req.body.map(card => ({
            ...card,
            user_id: req.user._id
        }));
        const data = await Flashcard.insertMany(cards);

        req.user.todayCompletedMinutes = (req.user.todayCompletedMinutes || 0) + (cards.length * 2); // 2 mins per item
        await req.user.save();

        return res.status(201).json(formatResponse(true, 'Flashcards created successfully', data));
    }

    const data = await createFlashcard(req.user._id, req.body);

    req.user.todayCompletedMinutes = (req.user.todayCompletedMinutes || 0) + 5;
    await req.user.save();

    res.status(201).json(formatResponse(true, 'Flashcard created successfully', data));
});


// @desc    Generate flashcards from AI
// @route   POST /api/flashcards/generate
// @access  Private
const generateFlashcards = asyncHandler(async (req, res, next) => {
    const { content, count } = req.body;
    if (!content) {
        res.status(400);
        throw new Error('Please provide content to generate flashcards');
    }

    const flashcards = await generateFlashcardsFromAI(content, count || 10);
    res.status(200).json(formatResponse(true, 'Flashcards generated successfully', flashcards));
});

// @desc    Update a flashcard
// @route   PUT /api/flashcards/:id
// @access  Private
const updateFlashcard = asyncHandler(async (req, res, next) => {
    const Flashcard = require('../models/Flashcard');
    const data = await Flashcard.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        req.body,
        { new: true }
    );
    if (!data) {
        res.status(404);
        throw new Error('Flashcard not found');
    }
    res.status(200).json(formatResponse(true, 'Flashcard updated successfully', data));
});

// @desc    Delete a flashcard deck
// @route   DELETE /api/flashcards/deck
// @access  Private
const deleteFlashcardDeck = asyncHandler(async (req, res, next) => {
    const Flashcard = require('../models/Flashcard');
    const { deckName } = req.query;
    if (!deckName) {
        res.status(400);
        throw new Error('Deck name is required');
    }
    const data = await Flashcard.deleteMany({ user_id: req.user._id, deck_name: deckName });
    res.status(200).json(formatResponse(true, 'Deck deleted successfully', data));
});

module.exports = {
    getFlashcards,
    addFlashcard,
    generateFlashcards,
    updateFlashcard,
    deleteFlashcardDeck
};


