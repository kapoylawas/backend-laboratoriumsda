const { body } = require('express-validator');

const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password wajib diisi'),
];

module.exports = { validateLogin };