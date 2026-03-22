const Note = require('../models/Note');

const getNotesByUserId = async (userId) => {
    return await Note.find({ user_id: userId }).sort({ updatedAt: -1 });
};

const createNote = async (userId, data) => {
    return await Note.create({ ...data, user_id: userId });
};

const deleteNote = async (id) => {
    return await Note.findByIdAndDelete(id);
};

const updateNote = async (id, data) => {
    return await Note.findByIdAndUpdate(id, data, { new: true });
};

module.exports = {
    getNotesByUserId,
    createNote,
    deleteNote,
    updateNote
};
