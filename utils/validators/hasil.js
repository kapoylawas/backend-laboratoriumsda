//import express validator
const { body } = require('express-validator');

// Definisikan validasi untuk create cart
const validateHasil = [
    body('metode').notEmpty().withMessage('metode is required'),
    body('hasil').notEmpty().withMessage('hasil is required'),
];

module.exports = { validateHasil }