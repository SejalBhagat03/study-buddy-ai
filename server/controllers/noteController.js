const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res, next) => {
    const data = await Note.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(formatResponse(true, 'Notes fetched successfully', data));
});

// @desc    Add a note
// @route   POST /api/notes
// @access  Private
const addNote = asyncHandler(async (req, res, next) => {
    const { title, content } = req.body;
    const data = await Note.create({
        title,
        content,
        user_id: req.user._id
    });
    res.status(201).json(formatResponse(true, 'Note added successfully', data));
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res, next) => {
    const data = await Note.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!data) {
        res.status(404);
        throw new Error('Note not found');
    }
    res.status(200).json(formatResponse(true, 'Note deleted successfully', data));
});

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = asyncHandler(async (req, res, next) => {
    const { title, content } = req.body;
    const data = await Note.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        { title, content },
        { new: true }
    );
    if (!data) {
        res.status(404);
        throw new Error('Note not found');
    }
    res.status(200).json(formatResponse(true, 'Note updated successfully', data));
});

module.exports = {
    getNotes,
    addNote,
    deleteNote,
    updateNote
};

