const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");


const findCategories = async (req, res) => {
    try {
        // Ambil halaman dan limit dari parameter query, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Ambil kata kunci pencarian dari parameter query
        const search = req.query.search || '';

        // Ambil kategori secara paginasi dari database dengan fitur pencarian
        const categories = await prisma.category.findMany({
            where: {
                name: {
                    contains: search, // Mencari nama kategori yang mengandung kata kunci
                },
            },
            select: {
                id: true,
                name: true,
                created_at: true,
                updated_at: true,
                Sampel: { // Menambahkan relasi ke Sampel
                    select: {
                        id: true,
                        parameter: true,
                        created_at: true,
                        updated_at: true
                    }
                }
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        // Dapatkan total jumlah kategori untuk paginasi
        const totalCategories = await prisma.category.count({
            where: {
                name: {
                    contains: search, // Menghitung jumlah total kategori yang sesuai dengan kata kunci pencarian
                },
            },
        });

        // Hitung total halaman
        const totalPages = Math.ceil(totalCategories / limit);

        // Kirim respons
        res.status(200).send({
            // Meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua kategori",
            },
            // Data kategori
            data: categories,
            // Paginasi
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalCategories,
            },
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

const createCategory = async (req, res) => {
    try {
        // Masukkan data kategori baru
        const category = await prisma.category.create({
            data: {
                name: req.body.name,
            },
        });

        res.status(201).send({
            meta: {
                success: true,
                message: "Kategori berhasil dibuat",
            },
            // data kategori baru
            data: category,
        })

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
}

const findCategoryById = async (req, res) => {
    // Ambil ID dari parameter URL
    const { id } = req.params;

    try {
        // Ambil kategori berdasarkan ID
        const category = await prisma.category.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!category) {
            // Jika kategori tidak ditemukan, kirim respons 404
            return res.status(404).send({
                // meta untuk respons dalam format JSON
                meta: {
                    success: false,
                    message: `Kategori dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Kirim respons
        res.status(200).send({
            // meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: `Berhasil mendapatkan kategori dengan ID: ${id}`,
            },
            // data kategori
            data: category,
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

const updateCategory = async (req, res) => {
    // Ambil ID dari parameter URL
    const { id } = req.params;

    try {
        // Update kategori dengan atau tanpa gambar
        const dataCategory = {
            name: req.body.name,
            status_paket: req.body.status_paket,
            updated_at: new Date(),
        };

        // Lakukan update data kategori
        const category = await prisma.category.update({
            where: {
                id: Number(id),
            },
            data: dataCategory,
        });

        // Kirim respons
        res.status(200).send({
            // meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: "Kategori berhasil diperbarui",
            },
            // data kategori yang diperbarui
            data: category,
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

const deleteCategory = async (req, res) => {
    // Ambil ID dari parameter URL
    const { id } = req.params;

    try {
        // Ambil kategori yang akan dihapus
        const category = await prisma.category.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!category) {
            // Jika kategori tidak ditemukan, kirim respons 404
            return res.status(404).send({
                // meta untuk respons dalam format JSON
                meta: {
                    success: false,
                    message: `Kategori dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Hapus kategori dari database
        await prisma.category.delete({
            where: {
                id: Number(id),
            },
        });

        // Kirim respons
        res.status(200).send({
            // meta untuk respons dalam format JSON
            meta: {
                success: true,
                message: "Kategori berhasil dihapus",
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

const allCategories = async (req, res) => {
    try {
        // Ambil kategori 
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                created_at: true,
                updated_at: true,
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
            // Data kategori
            data: categories,
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



// Ekspor fungsi-fungsi agar dapat digunakan di tempat lain
module.exports = {
    findCategories,
    createCategory,
    findCategoryById,
    updateCategory,
    deleteCategory,
    allCategories,
};