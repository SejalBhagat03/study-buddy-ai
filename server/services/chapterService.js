const Chapter = require('../models/Chapter');

const getChaptersByUserId = async (userId) => {
    return await Chapter.find({ user_id: userId }).sort({ createdAt: -1 });
};

const createChapter = async (userId, data) => {
    return await Chapter.create({ ...data, user_id: userId });
};

module.exports = {
    getChaptersByUserId,
    createChapter
};
