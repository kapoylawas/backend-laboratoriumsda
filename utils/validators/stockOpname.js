const { body } = require('express-validator');

const validateStockOpname = [
    body('nama_bmhp')
        .notEmpty().withMessage('Nama BMHP & Reagen wajib diisi'),
    body('satuan')
        .notEmpty().withMessage('Satuan wajib diisi'),
    body('harga_satuan')
        .isNumeric().withMessage('Harga Satuan harus berupa angka')
];

module.exports = {
    validateStockOpname
};
