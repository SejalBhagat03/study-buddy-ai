const { body, validationResult } = require('express-validator');

// Error formatter for request validation
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array().map(e => e.msg).join(', '));
        error.statusCode = 400;
        return next(error);
    }
    next();
};
const registerValidation = [
    body('name', 'Name is required').notEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    validate
];
const loginValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists(),
    validate
];

module.exports = {
    registerValidation,
    loginValidation
};
