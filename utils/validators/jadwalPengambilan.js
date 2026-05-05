const { body } = require('express-validator');

// Validation for creating Jadwal Pengambilan
const validateJadwalPengambilan = [
    body('transaction_detail_id')
        .notEmpty()
        .withMessage('transaction_detail_id diperlukan')
        .isInt({ min: 1 })
        .withMessage('transaction_detail_id harus berupa angka positif'),
    
    body('tanggal_pengambilan')
        .notEmpty()
        .withMessage('tanggal_pengambilan diperlukan')
        .isDate()
        .withMessage('tanggal_pengambilan harus berupa tanggal valid'),
    
    body('jam_pengambilan')
        .notEmpty()
        .withMessage('jam_pengambilan diperlukan')
        .isString()
        .withMessage('jam_pengambilan harus berupa string'),
    
    body('lokasi')
        .notEmpty()
        .withMessage('lokasi diperlukan')
        .isString()
        .withMessage('lokasi harus berupa string'),
    
    body('petugas')
        .notEmpty()
        .withMessage('petugas diperlukan')
        .isString()
        .withMessage('petugas harus berupa string'),
    
    body('catatan')
        .optional()
        .isString()
        .withMessage('Catatan harus berupa string'),
];

module.exports = {
    validateJadwalPengambilan,
};
