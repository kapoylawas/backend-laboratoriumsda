const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

const createSampel = async (req, res) => {
    try {
        const sampels = await prisma.sampel.create({
            data: {
                category_id: parseInt(req.body.category_id),
                parameter: req.body.parameter,
                price_sell: parseInt(req.body.price_sell),
            },
            include: {
                category: true,
            }
        });
        // Mengirim respons
        res.status(201).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Produk berhasil dibuat",
            },
            //data produk
            data: sampels,
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk respons JSON
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            //data kesalahan
            errors: error,
        });
    }
}

const findSampels = async (req, res) => {
    try {
        // Mengambil nilai halaman dan limit dari parameter query, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Ambil kata kunci pencarian dari parameter query
        const search = req.query.search || '';

        // Mengambil semua sampel dari database
        const sampels = await prisma.sampel.findMany({
            where: {
                parameter: {
                    contains: search, // Mencari judul sampel yang mengandung kata kunci
                },
            },
            select: {
                id: true,
                category_id: true,
                parameter: true,
                price_sell: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        // Mengambil jumlah total sampel untuk paginasi
        const totalSampels = await prisma.sampel.count({
            where: {
                parameter: {
                    contains: search, // Menghitung jumlah total sampel yang sesuai dengan kata kunci pencarian
                },
            },
        });

        // Menghitung total halaman
        const totalPages = Math.ceil(totalSampels / limit);

        // Mengirim respons
        res.status(200).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Berhasil mengambil semua sampel",
            },
            //data produk
            data: sampels,
            //paginasi
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalSampels,
            },
        });

    } catch (error) {
        // Mengirim respons jika terjadi kesalahan
        res.status(500).send({
            //meta untuk respons JSON
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            //data kesalahan
            errors: error,
        });
    }
};

module.exports = { createSampel, findSampels };