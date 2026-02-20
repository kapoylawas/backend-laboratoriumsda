const express = require("express");
const prisma = require("../prisma/client"); // pastikan path benar

const findHasilsAll = async (req, res) => {
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

const hasilsUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { hasil, metode, status, qty, price } = req.body; // tambahkan field lain jika perlu

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "ID hasil tidak valid"
            });
        }

        const idNumber = parseInt(id);

        // Cek apakah data exists
        const existingHasil = await prisma.hasil.findUnique({
            where: { id: idNumber }
        });

        if (!existingHasil) {
            return res.status(404).json({
                success: false,
                message: "Data hasil tidak ditemukan"
            });
        }

        // Prepare data untuk update
        const updateData = {};

        if (hasil !== undefined) {
            if (typeof hasil !== 'string' || hasil.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: "Hasil harus berupa string yang tidak kosong"
                });
            }
            updateData.hasil = hasil.trim();
        }

        if (metode !== undefined) {
            if (typeof metode !== 'string' || metode.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: "Metode harus berupa string yang tidak kosong"
                });
            }
            updateData.metode = metode.trim();
        }

        if (status !== undefined) {
            if (typeof status !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: "Status harus berupa boolean (true/false)"
                });
            }
            updateData.status = status;
        }

        if (qty !== undefined) {
            if (typeof qty !== 'number' || qty < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Qty harus berupa angka positif"
                });
            }
            updateData.qty = qty;
        }

        if (price !== undefined) {
            if (typeof price !== 'number' || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price harus berupa angka positif"
                });
            }
            updateData.price = price;
        }

        // Update data
        const updatedHasil = await prisma.hasil.update({
            where: { id: idNumber },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                sampel: {
                    select: {
                        id: true,
                        parameter: true,
                        price_sell: true,
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Data hasil berhasil diupdate",
            data: updatedHasil
        });

    } catch (error) {
        console.error("Error updating hasil:", error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: "Data hasil tidak ditemukan"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
};

module.exports = {
    findHasilsAll,
    hasilsUpdate
};