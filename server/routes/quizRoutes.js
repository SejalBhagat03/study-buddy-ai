const express = require('express');
const { getQuizzes, addQuiz, generateQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getQuizzes);
router.post('/', protect, addQuiz);
router.post('/generate', protect, generateQuiz);


module.exports = router;
