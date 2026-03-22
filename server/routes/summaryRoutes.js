const express = require('express');
const { generateSummary } = require('../controllers/summaryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/generate', protect, generateSummary);

module.exports = router;
