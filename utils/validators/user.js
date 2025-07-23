// Import express validator
const { body } = require('express-validator');

// Import prisma
const prisma = require('../../prisma/client');

// Helper function to check uniqueness excluding current user
const checkUnique = async (field, value, req) => {
    if (!value) {
        throw new Error(`${field} is required`);
    }

    const user = await prisma.user.findFirst({
        where: {
            [field]: value,
            NOT: {
                id: Number(req.params.id) || undefined
            }
        }
    });

    if (user) {
        throw new Error(`${field} already exists`);
    }
    return true;
};

// Define validation for create and update user
const validateUser = [
    body('name').notEmpty().withMessage('Name is required'),

    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is invalid')
        .custom(async (value, { req }) => checkUnique('email', value, req)),

    body('nik')
        .notEmpty().withMessage('NIK is required')
        .isLength({ min: 16, max: 16 }).withMessage('NIK must be 16 characters')
        .custom(async (value, { req }) => checkUnique('nik', value, req)),

    body('phone')
        .notEmpty().withMessage('Phone is required')
        .isMobilePhone().withMessage('Phone number is invalid')
        .custom(async (value, { req }) => checkUnique('phone', value, req)),

    body('gender')
        .notEmpty().withMessage('Gender is required')
        .isIn(['male', 'female', 'other']).withMessage('Invalid gender value'),

    body('alamat')
        .notEmpty().withMessage('Alamat is required'),

    // Conditional validation for password
    body('password')
        .if((value, { req }) => req.method === 'POST')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    body('password')
        .if((value, { req }) => req.method === 'PUT')
        .optional(),

    body('activationToken').optional(),
    body('tokenExpires').optional()
];

module.exports = { validateUser };