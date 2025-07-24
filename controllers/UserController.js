const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

const findUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Ambil kata kunci pencarian dari parameter query
        const search = req.query.search || '';

        // Mengambil semua pengguna dari database
        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: search,
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                gender: true,
                alamat: true,
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        // Menghitung total pengguna untuk pagination
        const totalUsers = await prisma.user.count({
            where: {
                name: {
                    contains: search,
                }
            },
        });

        // Menghitung total halaman
        const totalPages = Math.ceil(totalUsers / limit);

        // Mengirimkan respons
        res.status(200).send({
            //meta untuk response json
            meta: {
                success: true,
                message: "Berhasil mengambil semua pengguna",
            },
            //data
            data: users,
            //pagination
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                total: totalUsers,
            },
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan server"
            },

            errors: error
        })
    }
}

module.exports = {
    findUsers
}