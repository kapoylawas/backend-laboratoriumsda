const { body } = require('express-validator');
const prisma = require('../../prisma/client');

const validateCategory = [
    body('name')
        .notEmpty().withMessage('Category is required')
];

module.exports = { validateCategory };