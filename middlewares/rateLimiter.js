const rateLimit = require('express-rate-limit');

// Rate limiter khusus untuk login (mencegah serangan Brute Force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 10, // Maksimal 10 percobaan login per IP per 15 menit
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        meta: {
            success: false,
            message: 'Terlalu banyak percobaan login dari perangkat/IP ini. Demi keamanan, silakan coba lagi setelah 15 menit.',
        },
    },
});

// Rate limiter untuk pendaftaran akun (mencegah pendaftaran massal oleh bot)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 10, // Maksimal 10 registrasi per IP per jam
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        meta: {
            success: false,
            message: 'Terlalu banyak percobaan registrasi dari IP ini. Silakan coba lagi setelah 1 jam.',
        },
    },
});

// Rate limiter global untuk seluruh API (mencegah Denial of Service / DoS dan web scraping masif)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 500, // Maksimal 500 request per IP per 15 menit
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        meta: {
            success: false,
            message: 'Terlalu banyak permintaan ke server. Silakan perlambat laju permintaan Anda.',
        },
    },
});

module.exports = {
    loginLimiter,
    registerLimiter,
    apiLimiter,
};
