const { body } = require('express-validator');

// Validation for creating Pemohonan
const validatePemohonan = [
    body('jenis')
        .notEmpty()
        .withMessage('Jenis diperlukan')
        .isIn(['SURAT_PENAWARAN', 'PEMESANAN'])
        .withMessage('Jenis harus SURAT_PENAWARAN atau PEMESANAN'),
    
    body('items')
        .notEmpty()
        .withMessage('Items diperlukan')
        .isArray({ min: 1 })
        .withMessage('Items harus berupa array dengan minimal 1 item'),
    
    body('items.*.sampel_id')
        .notEmpty()
        .withMessage('sampel_id diperlukan untuk setiap item')
        .isInt({ min: 1 })
        .withMessage('sampel_id harus berupa angka positif'),
    
    body('items.*.qty')
        .notEmpty()
        .withMessage('qty diperlukan untuk setiap item')
        .isInt({ min: 1 })
        .withMessage('qty harus berupa angka positif'),
    
    body('catatan')
        .optional()
        .isString()
        .withMessage('Catatan harus berupa string'),
];

module.exports = {
    validatePemohonan,
};
