const { body } = require('express-validator');
const prisma = require('../../prisma/client');

const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .custom(async (email) => {
            const user = await prisma.user.findFirst({
                where: { email },
            });
            if (!user) {
                throw new Error('Email tidak terdaftar. Silakan daftar terlebih dahulu');
            }
            if (!user.is_active) {
                throw new Error('Akun belum aktif. Silakan periksa email Anda untuk melakukan aktivasi');
            }
        }),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

module.exports = { validateLogin };