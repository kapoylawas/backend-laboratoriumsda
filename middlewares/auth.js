// Import express
const express = require('express');

// Import jwt untuk verifikasi token JWT
const jwt = require('jsonwebtoken');

// Middleware untuk memverifikasi token
const verifyToken = (req, res, next) => {
    // Mengambil token dari header 'authorization'
    const token = req.headers['authorization'];

    // Jika token tidak ada, kirimkan respons tidak terautentikasi
    if (!token) return res.status(401).json({ message: 'Tidak terautentikasi.' });

    // Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token tidak valid' });

        req.userId = decoded.id;
        req.userRole = decoded.role_id; // Asumsikan role_id ada di payload token
        next();
    });
};

// Mengekspor middleware verifyToken agar dapat digunakan di tempat lain
module.exports = verifyToken;