const prisma = require("../prisma/client");

// Create new Pemohonan (Surat Penawaran or Pemesanan)
const createPemohonan = async (req, res) => {
    try {
        const { jenis, items, catatan } = req.body;

        // Validate input
        if (!jenis || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(422).send({
                meta: {
                    success: false,
                    message: "Jenis dan items array diperlukan",
                },
            });
        }

        // Validate jenis
        if (!['SURAT_PENAWARAN', 'PEMESANAN'].includes(jenis)) {
            return res.status(422).send({
                meta: {
                    success: false,
                    message: "Jenis harus SURAT_PENAWARAN atau PEMESANAN",
                },
            });
        }

        // Calculate expired date for SURAT_PENAWARAN (7 days)
        let tanggalExpired = null;
        if (jenis === 'SURAT_PENAWARAN') {
            const now = new Date();
            tanggalExpired = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        }

        // Validate and prepare items
        const validatedItems = [];
        let grandTotal = 0;

        for (const item of items) {
            const { sampel_id, qty } = item;

            if (!sampel_id || !qty) {
                return res.status(422).send({
                    meta: {
                        success: false,
                        message: "sampel_id dan qty diperlukan untuk setiap item",
                    },
                });
            }

            const sampelIdInt = parseInt(sampel_id);
            const qtyInt = parseInt(qty);

            if (isNaN(sampelIdInt) || isNaN(qtyInt) || qtyInt <= 0) {
                return res.status(422).send({
                    meta: {
                        success: false,
                        message: "sampel_id dan qty harus berupa angka valid",
                    },
                });
            }

            // Check if sampel exists
            const sampel = await prisma.sampel.findUnique({
                where: { id: sampelIdInt },
            });

            if (!sampel) {
                return res.status(404).send({
                    meta: {
                        success: false,
                        message: `Sampel dengan ID ${sampel_id} tidak ditemukan`,
                    },
                });
            }

            const price = sampel.price_sell * qtyInt;
            grandTotal += price;

            validatedItems.push({
                sampel_id: sampelIdInt,
                qty: qtyInt,
                price: price,
            });
        }

        // Create Pemohonan with items in a transaction
        const pemohonan = await prisma.$transaction(async (tx) => {
            const newPemohonan = await tx.pemohonan.create({
                data: {
                    user_id: req.user_id,
                    jenis: jenis,
                    status: 'PENDING',
                    tanggal_pengajuan: new Date(),
                    tanggal_expired: tanggalExpired,
                    catatan: catatan || null,
                },
            });

            // Create items
            const pemohonanItems = await Promise.all(
                validatedItems.map(item =>
                    tx.pemohonanItem.create({
                        data: {
                            pemohonan_id: newPemohonan.id,
                            sampel_id: item.sampel_id,
                            qty: item.qty,
                            price: item.price,
                        },
                        include: {
                            sampel: { include: { category: true } },
                        },
                    })
                )
            );

            return {
                ...newPemohonan,
                items: pemohonanItems,
                grand_total: grandTotal,
            };
        });

        return res.status(201).send({
            meta: {
                success: true,
                message: jenis === 'SURAT_PENAWARAN' 
                    ? "Surat Penawaran berhasil dibuat. Akan expired dalam 7 hari."
                    : "Pemesanan berhasil dibuat",
            },
            data: pemohonan,
        });

    } catch (error) {
        console.error("Error in createPemohonan:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Get all Pemohonan for current user
const getPemohonanByUserId = async (req, res) => {
    try {
        const { status, jenis } = req.query;

        const where = {
            user_id: req.user_id,
        };

        if (status) {
            where.status = status;
        }

        if (jenis) {
            where.jenis = jenis;
        }

        const pemohonans = await prisma.pemohonan.findMany({
            where: where,
            include: {
                items: {
                    include: {
                        sampel: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mengambil data pemohonan",
            },
            data: pemohonans,
        });

    } catch (error) {
        console.error("Error in getPemohonanByUserId:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Get Pemohonan by ID
const getPemohonanById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "ID tidak valid",
                },
            });
        }

        const pemohonan = await prisma.pemohonan.findUnique({
            where: {
                id: Number(id),
                user_id: req.user_id,
            },
            include: {
                items: {
                    include: {
                        sampel: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!pemohonan) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Pemohonan tidak ditemukan",
                },
            });
        }

        return res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mengambil data pemohonan",
            },
            data: pemohonan,
        });

    } catch (error) {
        console.error("Error in getPemohonanById:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Approve Pemohonan (convert SURAT_PENAWARAN to Order)
const approvePemohonan = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "ID tidak valid",
                },
            });
        }

        const pemohonan = await prisma.pemohonan.findUnique({
            where: {
                id: Number(id),
                user_id: req.user_id,
            },
            include: {
                items: true,
            },
        });

        if (!pemohonan) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Pemohonan tidak ditemukan",
                },
            });
        }

        if (pemohonan.status !== 'PENDING') {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Pemohonan sudah diproses sebelumnya",
                },
            });
        }

        // Check if expired (for SURAT_PENAWARAN)
        if (pemohonan.jenis === 'SURAT_PENAWARAN' && pemohonan.tanggal_expired) {
            if (new Date() > new Date(pemohonan.tanggal_expired)) {
                return res.status(400).send({
                    meta: {
                        success: false,
                        message: "Surat Penawaran sudah expired",
                    },
                });
            }
        }

        // Convert to Order in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update pemohonan status
            const updatedPemohonan = await tx.pemohonan.update({
                where: { id: pemohonan.id },
                data: {
                    status: 'APPROVED',
                    tanggal_action: new Date(),
                },
            });

            // Create Orders from items
            const orders = await Promise.all(
                pemohonan.items.map(item =>
                    tx.order.create({
                        data: {
                            user_id: req.user_id,
                            sampel_id: item.sampel_id,
                            qty: item.qty,
                            price: item.price,
                            status: false,
                        },
                        include: {
                            sampel: { include: { category: true } },
                        },
                    })
                )
            );

            // Create Hasil entries for each order
            const hasils = await Promise.all(
                pemohonan.items.map(item =>
                    tx.hasil.create({
                        data: {
                            user_id: req.user_id,
                            sampel_id: item.sampel_id,
                            qty: item.qty,
                            price: item.price,
                            hasil: "-",
                            metode: "-",
                            status: false,
                        },
                        include: {
                            sampel: { include: { category: true } },
                        },
                    })
                )
            );

            return {
                pemohonan: updatedPemohonan,
                orders: orders,
                hasils: hasils,
            };
        });

        return res.status(200).send({
            meta: {
                success: true,
                message: "Pemohonan berhasil disetujui dan order telah dibuat",
            },
            data: result,
        });

    } catch (error) {
        console.error("Error in approvePemohonan:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Cancel Pemohonan
const cancelPemohonan = async (req, res) => {
    try {
        const { id } = req.params;
        const { alasan } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "ID tidak valid",
                },
            });
        }

        const pemohonan = await prisma.pemohonan.findUnique({
            where: {
                id: Number(id),
                user_id: req.user_id,
            },
        });

        if (!pemohonan) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Pemohonan tidak ditemukan",
                },
            });
        }

        if (pemohonan.status !== 'PENDING') {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Pemohonan sudah diproses sebelumnya",
                },
            });
        }

        const updatedPemohonan = await prisma.pemohonan.update({
            where: { id: pemohonan.id },
            data: {
                status: 'CANCELLED',
                tanggal_action: new Date(),
                catatan: alasan ? `${pemohonan.catatan || ''} | Alasan pembatalan: ${alasan}` : pemohonan.catatan,
            },
        });

        return res.status(200).send({
            meta: {
                success: true,
                message: "Pemohonan berhasil dibatalkan",
            },
            data: updatedPemohonan,
        });

    } catch (error) {
        console.error("Error in cancelPemohonan:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Auto-cancel expired SURAT_PENAWARAN (to be called by cron job)
const cancelExpiredPemohonan = async (req, res) => {
    try {
        const now = new Date();

        // Find all expired SURAT_PENAWARAN that are still PENDING
        const expiredPemohonans = await prisma.pemohonan.findMany({
            where: {
                jenis: 'SURAT_PENAWARAN',
                status: 'PENDING',
                tanggal_expired: {
                    lt: now,
                },
            },
        });

        if (expiredPemohonans.length === 0) {
            return res.status(200).send({
                meta: {
                    success: true,
                    message: "Tidak ada pemohonan yang expired",
                },
                data: {
                    cancelled_count: 0,
                },
            });
        }

        // Cancel all expired pemohonans
        await prisma.$transaction(
            expiredPemohonans.map(pemohonan =>
                prisma.pemohonan.update({
                    where: { id: pemohonan.id },
                    data: {
                        status: 'EXPIRED',
                        tanggal_action: now,
                    },
                })
            )
        );

        return res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil membatalkan ${expiredPemohonans.length} surat penawaran yang expired`,
            },
            data: {
                cancelled_count: expiredPemohonans.length,
                pemohonan_ids: expiredPemohonans.map(p => p.id),
            },
        });

    } catch (error) {
        console.error("Error in cancelExpiredPemohonan:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

module.exports = {
    createPemohonan,
    getPemohonanByUserId,
    getPemohonanById,
    approvePemohonan,
    cancelPemohonan,
    cancelExpiredPemohonan,
};
