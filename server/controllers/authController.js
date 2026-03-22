const { registerUser, loginUser } = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const formatResponse = require('../utils/formatResponse');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    const data = await registerUser({ name, email, password, role });

    res.status(201).json(formatResponse(true, 'User registered successfully', data));
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const data = await loginUser({ email, password });

    res.status(200).json(formatResponse(true, 'Login successful', data));
});

module.exports = {
    register,
    login,
};

