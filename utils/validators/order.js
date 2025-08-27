//import express validator
const { body } = require('express-validator');

// Definisikan validasi untuk create cart
const validateOrder = [
    body('sampel_id').notEmpty().withMessage('sampel is required'),
    body('qty').notEmpty().withMessage('Qty is required'),
];

module.exports = { validateOrder }