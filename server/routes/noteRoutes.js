const express = require('express');
const { getNotes, addNote, updateNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getNotes);
router.post('/', protect, addNote);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);


module.exports = router;
