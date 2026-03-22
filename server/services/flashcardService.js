const Flashcard = require('../models/Flashcard');

const getFlashcardsByUserId = async (userId) => {
    return await Flashcard.find({ user_id: userId }).sort({ createdAt: -1 });
};

const createFlashcard = async (userId, data) => {
    return await Flashcard.create({ ...data, user_id: userId });
};

const deleteDeck = async (userId, deckName) => {
    return await Flashcard.deleteMany({ user_id: userId, deck_name: deckName });
};

module.exports = {
    getFlashcardsByUserId,
    createFlashcard,
    deleteDeck
};
