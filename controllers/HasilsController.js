const express = require("express");
const prisma = require("../prisma/client"); // ✅ SUDAH BENAR

// GET ALL HASILS WITH PAGINATION, FILTER, SEARCH
const findHasilsAll = async (req, res) => {
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

        // Filter by status (boolean)
        if (status !== undefined) {
            where.status = status === 'true';
        }

        // Filter by metode
        if (metode) {
            where.metode = metode;
        }

        // Search functionality
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
                            email: true,
                            nik: true,
                            phone: true
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

// UPDATE HASIL BY ID
const hasilsUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { hasil, metode, status, qty, price } = req.body;

        // Validasi ID
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

        // Prisma error codes
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