const express = require("express");
const prisma = require("../prisma/client");

// GET ALL HASILS WITH PAGINATION, FILTER, SEARCH
const findHasilsAll = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            status_verifikasi,
            metode,
            search,
            date,
            transaction_id,
            user_id
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

        // Filter by status_verifikasi
        if (status_verifikasi) {
            where.status_verifikasi = status_verifikasi;
        }

        // Filter by transaction_id
        if (transaction_id) {
            where.transaction_id = parseInt(transaction_id);
        }

        // Filter by user_id
        if (user_id) {
            where.user_id = parseInt(user_id);
        }

        // Filter by metode
        if (metode) {
            where.metode = metode;
        }

        // Filter by specific date (created_at)
        if (date) {
            const startDate = new Date(`${date}T00:00:00.000Z`);
            const endDate = new Date(`${date}T23:59:59.999Z`);
            where.created_at = {
                gte: startDate,
                lte: endDate
            };
        }

        // Search functionality
        if (search && typeof search === 'string' && search.trim() !== '' && search !== 'undefined' && search !== 'null') {
            const keyword = search.trim();
            where.OR = [
                { hasil: { contains: keyword } },
                { nomor_laporan: { contains: keyword } },
                { kode_sampel: { contains: keyword } },
                {
                    user: {
                        name: { contains: keyword }
                    }
                },
                {
                    sampel: {
                        parameter: { contains: keyword }
                    }
                },
                {
                    transaction: {
                        invoice: { contains: keyword }
                    }
                }
            ];
        }

        // Include standard relations
        const includeRelations = {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    nik: true,
                    nip: true,
                    pangkat: true,
                    phone: true
                }
            },
            verifikator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    nip: true,
                    pangkat: true
                }
            },
            kepala: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    nip: true,
                    pangkat: true
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
            },
            transaction: {
                select: {
                    id: true,
                    invoice: true,
                    created_at: true,
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        };

        // Execute query with pagination
        const [hasil, total] = await Promise.all([
            prisma.hasil.findMany({
                where,
                include: includeRelations,
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

// GET HASIL BY ID
const findHasilById = async (req, res) => {
    try {
        const { id } = req.params;
        const hasil = await prisma.hasil.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { id: true, name: true, email: true, nik: true, nip: true, pangkat: true } },
                verifikator: { select: { id: true, name: true, email: true, nip: true, pangkat: true } },
                kepala: { select: { id: true, name: true, email: true, nip: true, pangkat: true } },
                sampel: { select: { id: true, parameter: true, price_sell: true, category: { select: { id: true, name: true } } } },
                transaction: { select: { id: true, invoice: true, created_at: true, user: { select: { id: true, name: true, alamat: true } } } }
            }
        });

        if (!hasil) {
            return res.status(404).json({
                success: false,
                message: "Data hasil tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Detail data hasil berhasil diambil",
            data: hasil
        });
    } catch (error) {
        console.error("Error fetching hasil by id:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
};

// GET HASILS BY USER ID / TRANSACTION ID (For Multi-Sample Invoice Reports)
const findHasilsByInvoiceOrUser = async (req, res) => {
    try {
        const { id } = req.params; // Can be user_id or transaction_id
        const { user_id, transaction_id } = req.query;

        const where = {};
        if (transaction_id) {
            where.transaction_id = parseInt(transaction_id);
        } else if (user_id) {
            where.user_id = parseInt(user_id);
        } else if (id && !isNaN(parseInt(id))) {
            where.OR = [
                { user_id: parseInt(id) },
                { transaction_id: parseInt(id) }
            ];
        }

        const hasils = await prisma.hasil.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, nik: true, nip: true, pangkat: true } },
                verifikator: { select: { id: true, name: true, email: true, nip: true, pangkat: true } },
                kepala: { select: { id: true, name: true, email: true, nip: true, pangkat: true } },
                sampel: { select: { id: true, parameter: true, price_sell: true, category: { select: { id: true, name: true } } } },
                transaction: { select: { id: true, invoice: true, created_at: true, user: { select: { id: true, name: true, alamat: true } } } }
            },
            orderBy: { created_at: 'asc' }
        });

        return res.status(200).json({
            success: true,
            message: "Data kumpulan hasil per invoice berhasil diambil",
            data: hasils
        });
    } catch (error) {
        console.error("Error fetching hasils by invoice:", error);
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
        const {
            hasil,
            metode,
            status,
            qty,
            price,
            satuan,
            kode_sampel,
            kadar_maksimal,
            nomor_laporan,
            tujuan_permenkes,
            status_verifikasi,
            catatan_revisi,
            tanggal_pengerjaan
        } = req.body;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "ID hasil tidak valid"
            });
        }

        const idNumber = parseInt(id);

        const existingHasil = await prisma.hasil.findUnique({
            where: { id: idNumber }
        });

        if (!existingHasil) {
            return res.status(404).json({
                success: false,
                message: "Data hasil tidak ditemukan"
            });
        }

        const updateData = {};

        if (hasil !== undefined) updateData.hasil = typeof hasil === 'string' ? hasil.trim() : String(hasil);
        if (metode !== undefined) updateData.metode = typeof metode === 'string' ? metode.trim() : String(metode);
        if (satuan !== undefined) updateData.satuan = typeof satuan === 'string' ? satuan.trim() : String(satuan);
        if (kode_sampel !== undefined) updateData.kode_sampel = typeof kode_sampel === 'string' ? kode_sampel.trim() : String(kode_sampel);
        if (kadar_maksimal !== undefined) updateData.kadar_maksimal = typeof kadar_maksimal === 'string' ? kadar_maksimal.trim() : String(kadar_maksimal);
        if (nomor_laporan !== undefined) updateData.nomor_laporan = typeof nomor_laporan === 'string' ? nomor_laporan.trim() : String(nomor_laporan);
        if (tujuan_permenkes !== undefined) updateData.tujuan_permenkes = typeof tujuan_permenkes === 'string' ? tujuan_permenkes.trim() : String(tujuan_permenkes);
        if (status_verifikasi !== undefined) updateData.status_verifikasi = status_verifikasi;
        if (catatan_revisi !== undefined) updateData.catatan_revisi = catatan_revisi;
        if (status !== undefined) updateData.status = Boolean(status);
        if (qty !== undefined) updateData.qty = parseInt(qty);
        if (price !== undefined) updateData.price = parseFloat(price);
        if (tanggal_pengerjaan !== undefined) updateData.tanggal_pengerjaan = tanggal_pengerjaan ? new Date(tanggal_pengerjaan) : null;

        const updatedHasil = await prisma.hasil.update({
            where: { id: idNumber },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, email: true, nip: true } },
                verifikator: { select: { id: true, name: true, email: true, nip: true } },
                kepala: { select: { id: true, name: true, email: true, nip: true } },
                sampel: { select: { id: true, parameter: true, category: { select: { id: true, name: true } } } }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Data hasil berhasil diupdate",
            data: updatedHasil
        });

    } catch (error) {
        console.error("Error updating hasil:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
};

// VERIFIKASI BERJENJANG UPDATE STATUS (SINGLE OR BATCH PER USER/INVOICE)
const verifikasiStatusUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, catatan_revisi, nomor_laporan, tujuan_permenkes, hasil_ids } = req.body;
        const userId = req.userId;

        let idsToUpdate = [];

        if (hasil_ids && Array.isArray(hasil_ids) && hasil_ids.length > 0) {
            idsToUpdate = hasil_ids.map(i => parseInt(i));
        } else if (id && !isNaN(parseInt(id))) {
            idsToUpdate = [parseInt(id)];
        }

        if (idsToUpdate.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ID hasil tidak valid"
            });
        }

        const updateData = {};

        if (action === "SUBMIT_VERIFIKASI") {
            updateData.status_verifikasi = "MENUNGGU_VERIFIKASI";
            if (nomor_laporan) updateData.nomor_laporan = nomor_laporan;
            if (tujuan_permenkes) updateData.tujuan_permenkes = tujuan_permenkes;
            updateData.tanggal_pengerjaan = new Date();
        } else if (action === "VERIFY_APPROVE") {
            updateData.status_verifikasi = "DIVERIFIKASI";
            updateData.verifikator_id = userId;
            updateData.tanggal_verifikasi = new Date();
            updateData.catatan_revisi = null;
        } else if (action === "VERIFY_REJECT") {
            updateData.status_verifikasi = "REVISI_ANALIS";
            updateData.verifikator_id = userId;
            updateData.catatan_revisi = catatan_revisi || "Ada data yang perlu diperbaiki oleh Analis";
        } else if (action === "KEPALA_APPROVE") {
            updateData.status_verifikasi = "DISETUJUI";
            updateData.kepala_id = userId;
            updateData.tanggal_persetujuan = new Date();
            updateData.status = true;
        } else if (action === "KEPALA_REJECT") {
            updateData.status_verifikasi = "REVISI_ANALIS";
            updateData.kepala_id = userId;
            updateData.catatan_revisi = catatan_revisi || "Perlu revisi dari Kepala Labkesda";
        } else {
            return res.status(400).json({
                success: false,
                message: "Aksi verifikasi tidak valid"
            });
        }

        await prisma.hasil.updateMany({
            where: { id: { in: idsToUpdate } },
            data: updateData
        });

        return res.status(200).json({
            success: true,
            message: `Status verifikasi ${idsToUpdate.length} sampel berhasil diperbarui (${updateData.status_verifikasi})`
        });

    } catch (error) {
        console.error("Error updating status verifikasi:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
};

module.exports = {
    findHasilsAll,
    findHasilById,
    findHasilsByInvoiceOrUser,
    hasilsUpdate,
    verifikasiStatusUpdate
};