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

        // Build where condition berdasarkan field yang ADA di model Hasil
        const where = {};

        if (search) {
            where.OR = [
                // Mencari berdasarkan field 'hasil' di model Hasil
                { hasil: { contains: search, mode: 'insensitive' } },
                // Mencari berdasarkan field 'metode' di model Hasil
                { metode: { contains: search, mode: 'insensitive' } },
                // Mencari berdasarkan parameter sampel (melalui relasi)
                {
                    sampel: {
                        parameter: { contains: search, mode: 'insensitive' }
                    }
                },
                // Mencari berdasarkan nama user (melalui relasi)
                {
                    user: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        // Filter tambahan dari query params
        if (req.query.status !== undefined) {
            where.status = req.query.status === 'true';
        }

        if (req.query.metode) {
            where.metode = req.query.metode;
        }

        // Ambil hasil secara paginasi dari database
        const hasil = await prisma.hasil.findMany({
            where: where,
            select: {
                id: true,
                qty: true,
                price: true,
                hasil: true,
                metode: true,
                status: true,
                created_at: true,
                updated_at: true,
                // Relasi ke user
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        nik: true,
                        phone: true
                    }
                },
                // Relasi ke sampel (pakai huruf kecil)
                sampel: {
                    select: {
                        id: true,
                        parameter: true,
                        price_sell: true,
                        created_at: true,
                        updated_at: true,
                        // Include category dari sampel
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: "desc", // Better to use created_at instead of id
            },
            skip: skip,
            take: limit,
        });

        // Dapatkan total jumlah hasil untuk paginasi
        const totalHasil = await prisma.hasil.count({
            where: where
        });

        // Hitung total halaman
        const totalPages = Math.ceil(totalHasil / limit);

        // Kirim respons
        res.status(200).json({
            meta: {
                success: true,
                message: "Berhasil mendapatkan semua hasil",
            },
            data: hasil,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                perPage: limit,
                total: totalHasil,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
        });
    } catch (error) {
        console.error("Error detail:", error);
        res.status(500).json({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: {
                message: error.message,
                name: error.name
            },
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