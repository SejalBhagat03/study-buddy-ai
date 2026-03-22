const express = require('express');
const { getFlashcards, addFlashcard, generateFlashcards, updateFlashcard, deleteFlashcardDeck } = require('../controllers/flashcardController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getFlashcards);
router.post('/', protect, addFlashcard);
router.post('/generate', protect, generateFlashcards);
router.put('/:id', protect, updateFlashcard);
router.delete('/deck', protect, deleteFlashcardDeck);



module.exports = router;
