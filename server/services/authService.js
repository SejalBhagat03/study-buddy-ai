const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const registerUser = async ({ name, email, password, role }) => {
    const userExists = await User.findOne({ email });

    if (userExists) {
        const error = new Error('User already exists');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'user',
    });

    if (!user) {
        const error = new Error('Invalid user data');
        error.statusCode = 400;
        throw error;
    }

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    };
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    };
};

module.exports = {
    registerUser,
    loginUser,
};
