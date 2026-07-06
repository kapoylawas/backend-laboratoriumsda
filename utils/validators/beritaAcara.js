const { body } = require('express-validator');

const validateBeritaAcara = [
    body('jadwal_id')
        .notEmpty()
        .withMessage('jadwal_id diperlukan')
        .isInt({ min: 1 })
        .withMessage('jadwal_id harus berupa angka positif'),

    body('no_berita_acara')
        .notEmpty()
        .withMessage('no_berita_acara diperlukan')
        .isString()
        .withMessage('no_berita_acara harus berupa string'),

    body('jenis_sampel')
        .notEmpty()
        .withMessage('jenis_sampel diperlukan')
        .isString()
        .withMessage('jenis_sampel harus berupa string'),

    body('tujuan_pengambilan')
        .notEmpty()
        .withMessage('tujuan_pengambilan diperlukan'),

    body('tanggal_pengambilan')
        .notEmpty()
        .withMessage('tanggal_pengambilan diperlukan')
        .isISO8601()
        .withMessage('tanggal_pengambilan harus berupa format tanggal ISO8601 yang valid'),

    body('jumlah_wadah')
        .notEmpty()
        .withMessage('jumlah_wadah diperlukan'),

    body('petugas_pengambil')
        .notEmpty()
        .withMessage('petugas_pengambil diperlukan')
        .isString()
        .withMessage('petugas_pengambil harus berupa string'),

    body('status')
        .optional()
        .isIn(['DRAFT', 'FINAL'])
        .withMessage('status harus berupa DRAFT atau FINAL'),
];

module.exports = {
    validateBeritaAcara,
};
