const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

// Tambahkan ini untuk debugging atau cek schema Prisma
const findHasilAll = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            metode,
            search
        } = req.query;

        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        // Build filter conditions
        const where = {};

        if (status !== undefined) {
            where.status = status === 'true';
        }

        if (metode) {
            where.metode = metode;
        }

        if (search) {
            where.OR = [
                { hasil: { contains: search, mode: 'insensitive' } },
                {
                    user: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                },
                {
                    sampel: {
                        parameter: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        // Execute query with pagination
        const [hasil, total] = await Promise.all([
            prisma.hasil.findMany({
                where,
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
                            parameter: true,  // Gunakan field yang benar
                            price_sell: true,
                            // tambahkan field lain jika perlu
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip,
                take: pageSize
            }),
            prisma.hasil.count({ where })
        ]);

        const totalPages = Math.ceil(total / pageSize);

        return res.status(200).json({
            success: true,
            message: "Data hasil berhasil diambil",
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages,
                hasNext: pageNumber < totalPages,
                hasPrev: pageNumber > 1
            },
            data: hasil
        });
    } catch (error) {
        console.error("Error fetching hasil:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
};

const hasilUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { hasil, metode, status } = req.body; // Tambahkan status

        // Validasi: ID harus ada
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID hasil diperlukan"
            });
        }

        // Validasi: Data yang akan diupdate harus ada
        if (hasil === undefined && metode === undefined && status === undefined) {
            return res.status(400).json({
                success: false,
                message: "Minimal satu field (hasil, metode, atau status) harus diisi"
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

        // Tambahkan validasi dan update untuk status
        if (status !== undefined) {
            if (typeof status !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: "Status harus berupa boolean (true/false)"
                });
            }
            updateData.status = status;
        }

        // Update data
        const updatedHasil = await prisma.hasil.update({
            where: { id: parseInt(id) },
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
                        price_sell: true
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

        // Handle Prisma specific errors
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
    findHasilAll,
    hasilUpdate
}