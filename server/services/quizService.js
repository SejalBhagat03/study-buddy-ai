const Quiz = require('../models/Quiz');

const getQuizzesByUserId = async (userId) => {
    return await Quiz.find({ user_id: userId }).sort({ completed_at: -1 });
};

const createQuiz = async (userId, data) => {
    return await Quiz.create({ ...data, user_id: userId });
};

module.exports = {
    getQuizzesByUserId,
    createQuiz
};
