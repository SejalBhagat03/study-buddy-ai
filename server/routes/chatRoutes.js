const express = require('express');
const { generateChatResponse, generateSuggestions } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, generateChatResponse);
router.post('/suggestions', protect, generateSuggestions);


module.exports = router;
