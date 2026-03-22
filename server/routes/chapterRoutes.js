const express = require('express');
const { getChapters, addChapter } = require('../controllers/chapterController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getChapters);
router.post('/', protect, addChapter);

module.exports = router;
