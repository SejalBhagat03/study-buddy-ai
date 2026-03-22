const express = require('express');
const { getVideos, addVideo, deleteVideo } = require('../controllers/videoController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getVideos);
router.post('/', protect, addVideo);
router.delete('/:id', protect, deleteVideo);


module.exports = router;
