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
        const limit = parseInt(req.query.limit) || 100;
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

const findSampelById = async (req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

    try {
        // Mengambil sampel berdasarkan ID
        const sampel = await prisma.sampel.findUnique({
            where: {
                id: Number(id),
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
        });

        if (!sampel) {
            return res.status(404).send({
                //meta untuk respons JSON
                meta: {
                    success: false,
                    message: `Sampels dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Mengirim respons
        res.status(200).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: `Berhasil mengambil sampels dengan ID: ${id}`,
            },
            //data sampel
            data: sampel,
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

const updateSampels = async (req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

    try {

        // Mengupdate sampels
        const dataSampel = {
            category_id: parseInt(req.body.category_id),
            parameter: req.body.parameter,
            price_sell: parseInt(req.body.price_sell),
            updated_at: new Date(),
        };

        // Mengupdate sampels
        const sampels = await prisma.sampel.update({
            where: {
                id: Number(id),
            },
            data: dataSampel,
            include: {
                category: true,
            }
        });

        // Mengirim respons
        res.status(200).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Sampels berhasil diperbarui",
            },
            //data sampels
            data: sampels,
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
}

const deleteSampels = async (req, res) => {
    // Ambil ID dari parameter URL
    const { id } = req.params;

    try {
        // Ambil kategori yang akan dihapus
        const sampels = await prisma.sampel.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!sampels) {
            // Jika sampel tidak ditemukan, kirim respons 404
            return res.status(404).send({
                // meta untuk respons dalam format JSON
                meta: {
                    success: false,
                    message: `Sampel dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Hapus sampel dari database
        await prisma.sampel.delete({
            where: {
                id: Number(id),
            },
        });

        // Kirim respons
        res.status(200).send({
            // meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: "Sampel berhasil dihapus",
            },
        });
    } catch (error) {
        // Jika terjadi kesalahan, kirim respons kesalahan internal server
        res.status(500).send({
            // meta untuk respons dalam format JSON
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            // data kesalahan
            errors: error,
        });
    }
};

const findSampelsByCategoryId = async (req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const sampels = await prisma.sampel.findMany({
            where: {
                category_id: Number(id),
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
            skip: skip,
            take: limit,
        });

        // Mengambil jumlah total sampel untuk paginasi
        const totalSampel = await prisma.sampel.count({
            where: {
                category_id: Number(id), // Hitung sampel berdasarkan category ID
            },
        });

        // Menghitung total halaman
        const totalPages = Math.ceil(totalSampel / limit);

        // Mengambil nama kategori dari sampel pertama (jika ada)
        const categoryName = sampels.length > 0 ? sampels[0].category.name : "Tidak Diketahui";

        // Mengirim respons
        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mengambil sampel dengan category ID: ${id} (${categoryName})`,
            },
            data: sampels,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalSampel,
            },
        });
    } catch (error) {
        // Mengirim respons jika terjadi kesalahan
        res.status(500).send({
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            errors: error,
        });
    }
}

module.exports = { createSampel, findSampels, findSampelById, updateSampels, deleteSampels, findSampelsByCategoryId };