const prisma = require("../prisma/client");

// Create new Jadwal Pengambilan
const createJadwalPengambilan = async (req, res) => {
    try {
        const { transaction_detail_id, tanggal_pengambilan, jam_pengambilan, lokasi, petugas, catatan } = req.body;

        // Validate input
        if (!transaction_detail_id || !tanggal_pengambilan || !jam_pengambilan || !lokasi || !petugas) {
            return res.status(422).send({
                meta: {
                    success: false,
                    message: "transaction_detail_id, tanggal_pengambilan, jam_pengambilan, lokasi, dan petugas diperlukan",
                },
            });
        }

        // Check if transaction_detail exists and has status_bayar = true
        const transactionDetail = await prisma.transactionDetail.findUnique({
            where: { id: parseInt(transaction_detail_id) },
            include: {
                transaction: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!transactionDetail) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Transaction detail dengan ID ${transaction_detail_id} tidak ditemukan`,
                },
            });
        }

        if (!transactionDetail.status_bayar) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Jadwal pengambilan hanya bisa dibuat setelah pembayaran dilakukan (status_bayar = true)",
                },
            });
        }

        // Create Jadwal Pengambilan
        const jadwal = await prisma.jadwalPengambilan.create({
            data: {
                transaction_detail_id: parseInt(transaction_detail_id),
                tanggal_pengambilan: new Date(tanggal_pengambilan),
                jam_pengambilan,
                lokasi,
                petugas,
                catatan: catatan || null,
            },
            include: {
                transaction_detail: {
                    include: {
                        sampel: {
                            include: {
                                category: true,
                            },
                        },
                        transaction: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nik: true,
                                        phone: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return res.status(201).send({
            meta: {
                success: true,
                message: "Jadwal pengambilan berhasil dibuat. Berita Acara telah terbit.",
            },
            data: jadwal,
        });

    } catch (error) {
        console.error("Error in createJadwalPengambilan:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Get Jadwal Pengambilan by ID
const getJadwalPengambilanById = async (req, res) => {
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

        const jadwal = await prisma.jadwalPengambilan.findUnique({
            where: { id: Number(id) },
            include: {
                transaction_detail: {
                    include: {
                        sampel: {
                            include: {
                                category: true,
                            },
                        },
                        transaction: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nik: true,
                                        phone: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        // Fetch related hasil for this transaction detail
        if (jadwal && jadwal.transaction_detail) {
            const hasil = await prisma.hasil.findMany({
                where: {
                    sampel_id: jadwal.transaction_detail.sampel_id,
                    user_id: jadwal.transaction_detail.transaction.user_id
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 1
            });

            // Add hasil to response
            jadwal.transaction_detail.sampel.hasil = hasil;
        }

        if (!jadwal) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Jadwal pengambilan tidak ditemukan",
                },
            });
        }

        return res.status(200).send({
            meta: {
                success: true,
                message: "Berita Acara Pengambilan Sampel berhasil diambil",
            },
            data: jadwal,
        });

    } catch (error) {
        console.error("Error in getJadwalPengambilanById:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Get all Jadwal Pengambilan for current user (admin/staff only)
const getAllJadwalPengambilan = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        // Build filter conditions
        const where = {};

        // Search functionality
        if (search) {
            where.OR = [
                { lokasi: { contains: search, mode: 'insensitive' } },
                { petugas: { contains: search, mode: 'insensitive' } },
                {
                    transaction_detail: {
                        transaction: {
                            user: {
                                name: { contains: search, mode: 'insensitive' }
                            }
                        }
                    }
                }
            ];
        }

        // Execute query with pagination
        const [jadwals, total] = await Promise.all([
            prisma.jadwalPengambilan.findMany({
                where,
                include: {
                    transaction_detail: {
                        include: {
                            sampel: {
                                include: {
                                    category: true,
                                },
                            },
                            transaction: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            nik: true,
                                            phone: true,
                                        }
                                    }
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
            prisma.jadwalPengambilan.count({ where })
        ]);

        // Fetch related hasil for each jadwal
        const jadwalsWithHasil = await Promise.all(
            jadwals.map(async (jadwal) => {
                if (jadwal.transaction_detail && jadwal.transaction_detail.sampel_id && jadwal.transaction_detail.transaction && jadwal.transaction_detail.transaction.user_id) {
                    const hasil = await prisma.hasil.findMany({
                        where: {
                            sampel_id: jadwal.transaction_detail.sampel_id,
                            user_id: jadwal.transaction_detail.transaction.user_id
                        },
                        orderBy: {
                            created_at: 'desc'
                        },
                        take: 1
                    });

                    // Add hasil to sampel
                    jadwal.transaction_detail.sampel.hasil = hasil;
                }
                return jadwal;
            })
        );

        const totalPages = Math.ceil(total / pageSize);

        return res.status(200).send({
            meta: {
                success: true,
                message: "Data jadwal pengambilan berhasil diambil",
            },
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages,
                hasNext: pageNumber < totalPages,
                hasPrev: pageNumber > 1
            },
            data: jadwalsWithHasil,
        });

    } catch (error) {
        console.error("Error in getAllJadwalPengambilan:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Get Jadwal Pengambilan by User ID (for logged-in user)
const getJadwalByUserId = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        // Find all schedules for user's transactions
        const [jadwals, total] = await Promise.all([
            prisma.jadwalPengambilan.findMany({
                where: {
                    transaction_detail: {
                        transaction: {
                            user_id: req.user_id
                        }
                    }
                },
                include: {
                    transaction_detail: {
                        include: {
                            sampel: {
                                include: {
                                    category: true,
                                },
                            },
                            transaction: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            nik: true,
                                            phone: true,
                                        }
                                    }
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
            prisma.jadwalPengambilan.count({
                where: {
                    transaction_detail: {
                        transaction: {
                            user_id: req.user_id
                        }
                    }
                }
            })
        ]);

        // Fetch related hasil for each jadwal
        const jadwalsWithHasil = await Promise.all(
            jadwals.map(async (jadwal) => {
                if (jadwal.transaction_detail && jadwal.transaction_detail.sampel_id && jadwal.transaction_detail.transaction && jadwal.transaction_detail.transaction.user_id) {
                    const hasil = await prisma.hasil.findMany({
                        where: {
                            sampel_id: jadwal.transaction_detail.sampel_id,
                            user_id: jadwal.transaction_detail.transaction.user_id
                        },
                        orderBy: {
                            created_at: 'desc'
                        },
                        take: 1
                    });

                    // Add hasil to sampel
                    jadwal.transaction_detail.sampel.hasil = hasil;
                }
                return jadwal;
            })
        );

        const totalPages = Math.ceil(total / pageSize);

        return res.status(200).send({
            meta: {
                success: true,
                message: "Data jadwal pengambilan berhasil diambil",
            },
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages,
                hasNext: pageNumber < totalPages,
                hasPrev: pageNumber > 1
            },
            data: jadwalsWithHasil,
        });

    } catch (error) {
        console.error("Error in getJadwalByUserId:", error);
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
    createJadwalPengambilan,
    getJadwalByUserId,
    getJadwalPengambilanById,
    getAllJadwalPengambilan,
};
