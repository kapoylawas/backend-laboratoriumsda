const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

const findRolesAll = async (req, res) => {
    try {
        // Ambil role 
        const roles = await prisma.role.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                id: "desc",
            }
        });

        // Kirim respons
        res.status(200).send({
            // Meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua kategori",
            },
            // Data roles
            data: roles,
        });
    } catch (error) {
        // Jika terjadi kesalahan, kirim respons kesalahan internal server
        res.status(500).send({
            // Meta untuk respons dalam format JSON
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            // Data kesalahan
            errors: error,
        });
    }
};

module.exports = {
    findRolesAll
}