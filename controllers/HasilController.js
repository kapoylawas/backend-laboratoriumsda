const express = require("express");
const prisma = require("../prisma/client"); // pastikan path benar

const findHasilAll = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            metode,
            search
        } = req.query;

        const pageNumber = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.max(1, Math.min(100, parseInt(limit) || 10)); // batasi maksimal 100
        const skip = (pageNumber - 1) * pageSize;

        // Build filter conditions
        const where = {};

        if (status !== undefined && status !== '') {
            where.status = status === 'true';
        }

        // Validasi metode jika diperlukan
        if (metode) {
            const validMetode = ['metode1', 'metode2', 'metode3']; // sesuaikan
            if (!validMetode.includes(metode)) {
                return res.status(400).json({
                    success: false,
                    message: "Metode tidak valid"
                });
            }
            where.metode = metode;
        }

        if (search && search.trim() !== '') {
            where.OR = [
                { hasil: { contains: search.trim(), mode: 'insensitive' } },
                {
                    user: {
                        name: { contains: search.trim(), mode: 'insensitive' }
                    }
                },
                {
                    sampel: {
                        parameter: { contains: search.trim(), mode: 'insensitive' }
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
                            parameter: true,
                            price_sell: true,
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

        // Jika tidak ada data
        if (total === 0) {
            return res.status(200).json({
                success: true,
                message: "Tidak ada data hasil",
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                },
                data: []
            });
        }

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
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const hasilUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { hasil, metode, status } = req.body;

        // Validasi ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "ID hasil tidak valid"
            });
        }

        const idNumber = parseInt(id);

        // Validasi data yang akan diupdate
        if (hasil === undefined && metode === undefined && status === undefined) {
            return res.status(400).json({
                success: false,
                message: "Minimal satu field (hasil, metode, atau status) harus diisi"
            });
        }

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
            
            // Validasi metode jika diperlukan
            const validMetode = ['metode1', 'metode2', 'metode3']; // sesuaikan
            if (!validMetode.includes(metode.trim())) {
                return res.status(400).json({
                    success: false,
                    message: "Metode tidak valid"
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
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    findHasilAll,
    hasilUpdate
};