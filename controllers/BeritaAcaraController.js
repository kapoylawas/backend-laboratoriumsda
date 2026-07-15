const prisma = require("../prisma/client");

// Create new Berita Acara
const createBeritaAcara = async (req, res) => {
    try {
        const {
            jadwal_id,
            no_berita_acara,
            jenis_sampel,
            nama_sampel,
            tujuan_pengambilan,
            titik_pengambilan,
            tanggal_pengambilan,
            waktu_pengambilan,
            tanggal_selesai_estimasi,
            jumlah_wadah,
            peralatan_pengambilan,
            peralatan_pengukur,
            peralatan_pendukung,
            peralatan_k3,
            cara_pengambilan,
            pengendalian_mutu,
            pengawet,
            pengamanan_transportasi,
            hasil_lapangan,
            petugas_pengambil,
            pelanggan_saksi,
            status
        } = req.body;

        // Check if Jadwal exists
        const jadwal = await prisma.jadwalPengambilan.findUnique({
            where: { id: parseInt(jadwal_id) },
            include: {
                transaction_detail: true
            }
        });

        if (!jadwal) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Jadwal pengambilan dengan ID ${jadwal_id} tidak ditemukan`
                }
            });
        }

        // Verify if payment is completed
        if (!jadwal.transaction_detail.status_bayar) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Berita Acara hanya dapat dibuat jika transaksi telah lunas"
                }
            });
        }

        // Check if Berita Acara already exists for this jadwal
        const existingBA = await prisma.beritaAcara.findUnique({
            where: { jadwal_id: parseInt(jadwal_id) }
        });

        if (existingBA) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Berita Acara untuk jadwal pengambilan ini sudah ada"
                }
            });
        }

        // Check if no_berita_acara is unique
        const existingNo = await prisma.beritaAcara.findUnique({
            where: { no_berita_acara }
        });

        if (existingNo) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: `Nomor Berita Acara '${no_berita_acara}' sudah digunakan`
                }
            });
        }

        // Helper to stringify JSON payloads if they are objects
        const safeStringify = (val) => typeof val === 'object' ? JSON.stringify(val) : val;

        let foto_pengambilan = null;
        let foto_pelabelan = null;
        let foto_pengemasan = null;

        if (req.files) {
            if (req.files['foto_pengambilan'] && req.files['foto_pengambilan'][0]) {
                foto_pengambilan = req.files['foto_pengambilan'][0].filename;
            }
            if (req.files['foto_pelabelan'] && req.files['foto_pelabelan'][0]) {
                foto_pelabelan = req.files['foto_pelabelan'][0].filename;
            }
            if (req.files['foto_pengemasan'] && req.files['foto_pengemasan'][0]) {
                foto_pengemasan = req.files['foto_pengemasan'][0].filename;
            }
        }

        const beritaAcara = await prisma.beritaAcara.create({
            data: {
                jadwal_id: parseInt(jadwal_id),
                no_berita_acara,
                jenis_sampel,
                nama_sampel: nama_sampel || null,
                tujuan_pengambilan: safeStringify(tujuan_pengambilan),
                titik_pengambilan: titik_pengambilan || null,
                tanggal_pengambilan: new Date(tanggal_pengambilan),
                waktu_pengambilan: waktu_pengambilan || null,
                tanggal_selesai_estimasi: tanggal_selesai_estimasi ? new Date(tanggal_selesai_estimasi) : null,
                jumlah_wadah: safeStringify(jumlah_wadah),
                peralatan_pengambilan: safeStringify(peralatan_pengambilan),
                peralatan_pengukur: safeStringify(peralatan_pengukur),
                peralatan_pendukung: safeStringify(peralatan_pendukung),
                peralatan_k3: safeStringify(peralatan_k3),
                cara_pengambilan: safeStringify(cara_pengambilan),
                pengendalian_mutu: safeStringify(pengendalian_mutu),
                pengawet: safeStringify(pengawet),
                pengamanan_transportasi: safeStringify(pengamanan_transportasi),
                hasil_lapangan: safeStringify(hasil_lapangan),
                petugas_pengambil,
                pelanggan_saksi: pelanggan_saksi || null,
                foto_pengambilan,
                foto_pelabelan,
                foto_pengemasan,
                status: status || 'DRAFT'
            }
        });

        return res.status(201).send({
            meta: {
                success: true,
                message: "Berita Acara pengambilan sampel berhasil dibuat"
            },
            data: beritaAcara
        });

    } catch (error) {
        console.error("Error in createBeritaAcara:", error);
        try {
            require('fs').writeFileSync(require('path').join(__dirname, '../error.log'), `${new Date().toISOString()}\nError in createBeritaAcara:\n${error.stack || error.message}\n\n`);
        } catch (e) {
            console.error("Failed to write error.log:", e);
        }
        return res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server"
            },
            errors: error.message
        });
    }
};

// Get all Berita Acara (with Role Filtering)
const getBeritaAcara = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        const where = {};

        // If the user is Pemohon (role_id === 1), filter by user_id
        if (req.userRole === 1) {
            where.jadwal = {
                transaction_detail: {
                    transaction: {
                        user_id: req.user_id
                    }
                }
            };
        }

        // Apply search keyword
        if (search) {
            where.OR = [
                { no_berita_acara: { contains: search } },
                { jenis_sampel: { contains: search } },
                { petugas_pengambil: { contains: search } },
                {
                    jadwal: {
                        transaction_detail: {
                            transaction: {
                                user: {
                                    name: { contains: search }
                                }
                            }
                        }
                    }
                }
            ];
        }

        const [records, total] = await Promise.all([
            prisma.beritaAcara.findMany({
                where,
                include: {
                    jadwal: {
                        include: {
                            transaction_detail: {
                                include: {
                                    sampel: {
                                        include: { category: true }
                                    },
                                    transaction: {
                                        include: {
                                            user: {
                                                select: { id: true, name: true, phone: true, nik: true, email: true }
                                            }
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
            prisma.beritaAcara.count({ where })
        ]);

        const totalPages = Math.ceil(total / pageSize);

        // Helper to parse strings back to objects
        const safeParse = (str) => {
            try {
                return JSON.parse(str);
            } catch (e) {
                return str;
            }
        };

        const formattedRecords = records.map(r => ({
            ...r,
            tujuan_pengambilan: safeParse(r.tujuan_pengambilan),
            jumlah_wadah: safeParse(r.jumlah_wadah),
            peralatan_pengambilan: safeParse(r.peralatan_pengambilan),
            peralatan_pengukur: safeParse(r.peralatan_pengukur),
            peralatan_pendukung: safeParse(r.peralatan_pendukung),
            peralatan_k3: safeParse(r.peralatan_k3),
            cara_pengambilan: safeParse(r.cara_pengambilan),
            pengendalian_mutu: safeParse(r.pengendalian_mutu),
            pengawet: safeParse(r.pengawet),
            pengamanan_transportasi: safeParse(r.pengamanan_transportasi),
            hasil_lapangan: safeParse(r.hasil_lapangan)
        }));

        return res.status(200).send({
            meta: {
                success: true,
                message: "Data Berita Acara berhasil diambil"
            },
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages,
                hasNext: pageNumber < totalPages,
                hasPrev: pageNumber > 1
            },
            data: formattedRecords
        });

    } catch (error) {
        console.error("Error in getBeritaAcara:", error);
        return res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server"
            },
            errors: error.message
        });
    }
};

// Get Berita Acara by ID
const getBeritaAcaraById = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await prisma.beritaAcara.findUnique({
            where: { id: parseInt(id) },
            include: {
                jadwal: {
                    include: {
                        transaction_detail: {
                            include: {
                                sampel: {
                                    include: { category: true }
                                },
                                transaction: {
                                    include: {
                                        user: {
                                            select: { id: true, name: true, phone: true, nik: true, email: true, alamat: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!record) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Berita Acara tidak ditemukan"
                }
            });
        }

        // Restrict Pemohon from accessing other's Berita Acara
        if (req.userRole === 1 && record.jadwal.transaction_detail.transaction.user_id !== req.user_id) {
            return res.status(403).send({
                meta: {
                    success: false,
                    message: "Akses ditolak"
                }
            });
        }

        const safeParse = (str) => {
            try {
                return JSON.parse(str);
            } catch (e) {
                return str;
            }
        };

        const formattedRecord = {
            ...record,
            tujuan_pengambilan: safeParse(record.tujuan_pengambilan),
            jumlah_wadah: safeParse(record.jumlah_wadah),
            peralatan_pengambilan: safeParse(record.peralatan_pengambilan),
            peralatan_pengukur: safeParse(record.peralatan_pengukur),
            peralatan_pendukung: safeParse(record.peralatan_pendukung),
            peralatan_k3: safeParse(record.peralatan_k3),
            cara_pengambilan: safeParse(record.cara_pengambilan),
            pengendalian_mutu: safeParse(record.pengendalian_mutu),
            pengawet: safeParse(record.pengawet),
            pengamanan_transportasi: safeParse(record.pengamanan_transportasi),
            hasil_lapangan: safeParse(record.hasil_lapangan)
        };

        return res.status(200).send({
            meta: {
                success: true,
                message: "Berita Acara berhasil ditemukan"
            },
            data: formattedRecord
        });

    } catch (error) {
        console.error("Error in getBeritaAcaraById:", error);
        return res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server"
            },
            errors: error.message
        });
    }
};

// Get Berita Acara by Jadwal ID
const getBeritaAcaraByJadwalId = async (req, res) => {
    try {
        const { jadwalId } = req.params;

        const record = await prisma.beritaAcara.findUnique({
            where: { jadwal_id: parseInt(jadwalId) },
            include: {
                jadwal: {
                    include: {
                        transaction_detail: {
                            include: {
                                sampel: {
                                    include: { category: true }
                                },
                                transaction: {
                                    include: {
                                        user: {
                                            select: { id: true, name: true, phone: true, nik: true, email: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!record) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Berita Acara tidak ditemukan untuk jadwal ini"
                }
            });
        }

        if (req.userRole === 1 && record.jadwal.transaction_detail.transaction.user_id !== req.user_id) {
            return res.status(403).send({
                meta: {
                    success: false,
                    message: "Akses ditolak"
                }
            });
        }

        const safeParse = (str) => {
            try {
                return JSON.parse(str);
            } catch (e) {
                return str;
            }
        };

        const formattedRecord = {
            ...record,
            tujuan_pengambilan: safeParse(record.tujuan_pengambilan),
            jumlah_wadah: safeParse(record.jumlah_wadah),
            peralatan_pengambilan: safeParse(record.peralatan_pengambilan),
            peralatan_pengukur: safeParse(record.peralatan_pengukur),
            peralatan_pendukung: safeParse(record.peralatan_pendukung),
            peralatan_k3: safeParse(record.peralatan_k3),
            cara_pengambilan: safeParse(record.cara_pengambilan),
            pengendalian_mutu: safeParse(record.pengendalian_mutu),
            pengawet: safeParse(record.pengawet),
            pengamanan_transportasi: safeParse(record.pengamanan_transportasi),
            hasil_lapangan: safeParse(record.hasil_lapangan)
        };

        return res.status(200).send({
            meta: {
                success: true,
                message: "Berita Acara berhasil ditemukan"
            },
            data: formattedRecord
        });

    } catch (error) {
        console.error("Error in getBeritaAcaraByJadwalId:", error);
        return res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server"
            },
            errors: error.message
        });
    }
};

// Update Berita Acara
const updateBeritaAcara = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            jenis_sampel,
            nama_sampel,
            tujuan_pengambilan,
            titik_pengambilan,
            tanggal_pengambilan,
            waktu_pengambilan,
            tanggal_selesai_estimasi,
            jumlah_wadah,
            peralatan_pengambilan,
            peralatan_pengukur,
            peralatan_pendukung,
            peralatan_k3,
            cara_pengambilan,
            pengendalian_mutu,
            pengawet,
            pengamanan_transportasi,
            hasil_lapangan,
            petugas_pengambil,
            pelanggan_saksi,
            status
        } = req.body;

        const record = await prisma.beritaAcara.findUnique({
            where: { id: parseInt(id) }
        });

        if (!record) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Berita Acara tidak ditemukan"
                }
            });
        }

        if (record.status === 'FINAL' && req.userRole !== 2) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Berita Acara yang sudah FINAL tidak dapat diubah kecuali oleh Admin"
                }
            });
        }

        const safeStringify = (val) => typeof val === 'object' ? JSON.stringify(val) : val;

        let foto_pengambilan = record.foto_pengambilan;
        let foto_pelabelan = record.foto_pelabelan;
        let foto_pengemasan = record.foto_pengemasan;

        if (req.files) {
            if (req.files['foto_pengambilan'] && req.files['foto_pengambilan'][0]) {
                foto_pengambilan = req.files['foto_pengambilan'][0].filename;
            }
            if (req.files['foto_pelabelan'] && req.files['foto_pelabelan'][0]) {
                foto_pelabelan = req.files['foto_pelabelan'][0].filename;
            }
            if (req.files['foto_pengemasan'] && req.files['foto_pengemasan'][0]) {
                foto_pengemasan = req.files['foto_pengemasan'][0].filename;
            }
        }

        const updated = await prisma.beritaAcara.update({
            where: { id: parseInt(id) },
            data: {
                jenis_sampel: jenis_sampel !== undefined ? jenis_sampel : record.jenis_sampel,
                nama_sampel: nama_sampel !== undefined ? nama_sampel : record.nama_sampel,
                tujuan_pengambilan: tujuan_pengambilan !== undefined ? safeStringify(tujuan_pengambilan) : record.tujuan_pengambilan,
                titik_pengambilan: titik_pengambilan !== undefined ? titik_pengambilan : record.titik_pengambilan,
                tanggal_pengambilan: tanggal_pengambilan !== undefined ? new Date(tanggal_pengambilan) : record.tanggal_pengambilan,
                waktu_pengambilan: waktu_pengambilan !== undefined ? waktu_pengambilan : record.waktu_pengambilan,
                tanggal_selesai_estimasi: tanggal_selesai_estimasi !== undefined ? (tanggal_selesai_estimasi ? new Date(tanggal_selesai_estimasi) : null) : record.tanggal_selesai_estimasi,
                jumlah_wadah: jumlah_wadah !== undefined ? safeStringify(jumlah_wadah) : record.jumlah_wadah,
                peralatan_pengambilan: peralatan_pengambilan !== undefined ? safeStringify(peralatan_pengambilan) : record.peralatan_pengambilan,
                peralatan_pengukur: peralatan_pengukur !== undefined ? safeStringify(peralatan_pengukur) : record.peralatan_pengukur,
                peralatan_pendukung: peralatan_pendukung !== undefined ? safeStringify(peralatan_pendukung) : record.peralatan_pendukung,
                peralatan_k3: peralatan_k3 !== undefined ? safeStringify(peralatan_k3) : record.peralatan_k3,
                cara_pengambilan: cara_pengambilan !== undefined ? safeStringify(cara_pengambilan) : record.cara_pengambilan,
                pengendalian_mutu: pengendalian_mutu !== undefined ? safeStringify(pengendalian_mutu) : record.pengendalian_mutu,
                pengawet: pengawet !== undefined ? safeStringify(pengawet) : record.pengawet,
                pengamanan_transportasi: pengamanan_transportasi !== undefined ? safeStringify(pengamanan_transportasi) : record.pengamanan_transportasi,
                hasil_lapangan: hasil_lapangan !== undefined ? safeStringify(hasil_lapangan) : record.hasil_lapangan,
                petugas_pengambil: petugas_pengambil !== undefined ? petugas_pengambil : record.petugas_pengambil,
                pelanggan_saksi: pelanggan_saksi !== undefined ? pelanggan_saksi : record.pelanggan_saksi,
                foto_pengambilan,
                foto_pelabelan,
                foto_pengemasan,
                status: status !== undefined ? status : record.status
            }
        });

        return res.status(200).send({
            meta: {
                success: true,
                message: "Berita Acara berhasil diperbarui"
            },
            data: updated
        });

    } catch (error) {
        console.error("Error in updateBeritaAcara:", error);
        try {
            require('fs').writeFileSync(require('path').join(__dirname, '../error.log'), `${new Date().toISOString()}\nError in updateBeritaAcara:\n${error.stack || error.message}\n\n`);
        } catch (e) {
            console.error("Failed to write error.log:", e);
        }
        return res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server"
            },
            errors: error.message
        });
    }
};

// Delete Berita Acara
const deleteBeritaAcara = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await prisma.beritaAcara.findUnique({
            where: { id: parseInt(id) }
        });

        if (!record) {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Berita Acara tidak ditemukan"
                }
            });
        }

        await prisma.beritaAcara.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).send({
            meta: {
                success: true,
                message: "Berita Acara berhasil dihapus"
            }
        });

    } catch (error) {
        console.error("Error in deleteBeritaAcara:", error);
        return res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server"
            },
            errors: error.message
        });
    }
};

module.exports = {
    createBeritaAcara,
    getBeritaAcara,
    getBeritaAcaraById,
    getBeritaAcaraByJadwalId,
    updateBeritaAcara,
    deleteBeritaAcara
};
