const prisma = require("../prisma/client");

// GET /api/reports - Get report aggregation data for sample testing
const getLaporan = async (req, res) => {
    try {
        const { month, year, startDate, endDate, search } = req.query;

        const where = {};

        // Date range filter
        if (startDate && endDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`);
            const end = new Date(`${endDate}T23:59:59.999Z`);
            where.created_at = { gte: start, lte: end };
        } else if (month && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
            const end = new Date(y, m, 0, 23, 59, 59, 999);
            where.created_at = { gte: start, lte: end };
        } else if (year) {
            const y = parseInt(year);
            const start = new Date(y, 0, 1, 0, 0, 0, 0);
            const end = new Date(y, 11, 31, 23, 59, 59, 999);
            where.created_at = { gte: start, lte: end };
        }

        // Search filter
        if (search && typeof search === 'string' && search.trim() !== '') {
            const keyword = search.trim();
            where.OR = [
                { hasil: { contains: keyword } },
                { nomor_laporan: { contains: keyword } },
                { kode_sampel: { contains: keyword } },
                { sampel: { parameter: { contains: keyword } } },
                { sampel: { category: { name: { contains: keyword } } } },
                {
                    transaction: {
                        user: {
                            OR: [
                                { name: { contains: keyword } },
                                { nama_perusahaan: { contains: keyword } },
                                { alamat: { contains: keyword } },
                                { phone: { contains: keyword } }
                            ]
                        }
                    }
                }
            ];
        }

        // Query database
        const hasils = await prisma.hasil.findMany({
            where,
            include: {
                sampel: {
                    include: {
                        category: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        alamat: true,
                        nama_perusahaan: true
                    }
                },
                analis: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                verifikator: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                transaction: {
                    include: {
                        user: true,
                        transaction_details: {
                            include: {
                                JadwalPengambilan: {
                                    include: {
                                        berita_acara: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        // Pre-fetch jadwals with berita acara grouped by user_id + sampel_id
        // (because hasil.transaction_id is null, so we link via user_id + sampel_id)
        const userIds = [...new Set(hasils.map(h => h.user_id).filter(Boolean))];
        const sampelIds = [...new Set(hasils.map(h => h.sampel_id).filter(Boolean))];

        const allJadwals = await prisma.jadwalPengambilan.findMany({
            where: {
                berita_acara_id: { not: null },
                transaction_detail: {
                    sampel_id: { in: sampelIds },
                    transaction: { user_id: { in: userIds } }
                }
            },
            include: {
                berita_acara: true,
                transaction_detail: {
                    select: {
                        sampel_id: true,
                        transaction: { select: { user_id: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Build lookup map: "user_id:sampel_id" -> beritaAcara
        const baMap = {};
        for (const jadwal of allJadwals) {
            const userId = jadwal.transaction_detail?.transaction?.user_id;
            const sampelId = jadwal.transaction_detail?.sampel_id;
            if (userId && sampelId && jadwal.berita_acara) {
                const key = `${userId}:${sampelId}`;
                if (!baMap[key]) {
                    baMap[key] = { beritaAcara: jadwal.berita_acara, jadwal };
                }
            }
        }

        // Map data to 13-column report structure
        const formattedData = hasils.map((item, index) => {
            // Find associated berita acara via user_id+sampel_id lookup (hasil.transaction_id is null)
            let beritaAcara = null;
            let jadwalDate = item.created_at;
            let jadwalLokasi = null;

            // Primary: lookup from pre-fetched baMap
            const baKey = `${item.user_id}:${item.sampel_id}`;
            if (baMap[baKey]) {
                beritaAcara = baMap[baKey].beritaAcara;
                const j = baMap[baKey].jadwal;
                if (j.tanggal_pengambilan) jadwalDate = j.tanggal_pengambilan;
                if (j.lokasi) jadwalLokasi = j.lokasi;
            }

            // Secondary fallback: via transaction if transaction_id exists
            if (!beritaAcara && item.transaction && item.transaction.transaction_details) {
                for (const td of item.transaction.transaction_details) {
                    if (td.JadwalPengambilan && td.JadwalPengambilan.length > 0) {
                        for (const j of td.JadwalPengambilan) {
                            if (j.berita_acara) {
                                beritaAcara = j.berita_acara;
                                if (j.tanggal_pengambilan) jadwalDate = j.tanggal_pengambilan;
                                if (j.lokasi) jadwalLokasi = j.lokasi;
                                break;
                            }
                        }
                    }
                    if (beritaAcara) break;
                }
            }

            const customerUser = item.transaction?.user || item.user;
            const namaPelanggan = customerUser?.nama_perusahaan
                ? customerUser.nama_perusahaan
                : customerUser?.name
                ? customerUser.name
                : beritaAcara?.nama_pelanggan
                ? beritaAcara.nama_pelanggan
                : "Pelanggan Umum";

            // Titik Pengambilan dari Berita Acara atau Jadwal
            const titikPengambilan = beritaAcara?.titik_pengambilan || beritaAcara?.nama_sampel || jadwalLokasi || "-";

            // Kondisi Sampel dari Berita Acara (pengamanan_transportasi / jumlah_wadah)
            let kondisiSampel = "-";
            if (beritaAcara?.pengamanan_transportasi) {
                try {
                    const parsed = JSON.parse(beritaAcara.pengamanan_transportasi);
                    if (Array.isArray(parsed)) {
                        kondisiSampel = parsed.join(", ");
                    } else if (typeof parsed === "object" && parsed !== null) {
                        kondisiSampel = Object.values(parsed).filter(Boolean).join(", ");
                    } else {
                        kondisiSampel = String(parsed);
                    }
                } catch (e) {
                    kondisiSampel = beritaAcara.pengamanan_transportasi;
                }
            } else if (beritaAcara?.jumlah_wadah) {
                try {
                    const parsed = JSON.parse(beritaAcara.jumlah_wadah);
                    if (typeof parsed === "object" && parsed !== null) {
                        kondisiSampel = `Baik (${parsed.qty || 1} ${parsed.tipe || 'Wadah'})`;
                    }
                } catch (e) {}
            }

            return {
                id: item.id,
                tr_number: index + 1,
                nomor_sampel: item.kode_sampel || item.nomor_laporan || `${item.id}/AM/${new Date(item.created_at).getMonth() + 1}/${new Date(item.created_at).getFullYear()}`,
                tanggal_pengambilan: beritaAcara?.tanggal_pengambilan || jadwalDate,
                nama_pelanggan: namaPelanggan,
                alamat: customerUser?.alamat || beritaAcara?.alamat || "-",
                phone: customerUser?.phone || beritaAcara?.phone || "-",
                jenis_sampel: item.sampel?.category?.name || beritaAcara?.jenis_sampel || "Air Minum",
                parameter: item.sampel?.parameter || "-",
                jumlah_sampel: item.qty || 1,
                titik_pengambilan: titikPengambilan,
                kondisi_sampel: kondisiSampel !== "-" ? kondisiSampel : "Baik, Vol Cukup, suhu <5C",
                petugas: item.analis?.name || item.verifikator?.name || beritaAcara?.petugas_pengambil || item.user?.name || "Petugas Lab",
                hasil: item.hasil ? `${item.hasil}${item.satuan ? ' ' + item.satuan : ''}` : "-",
                raw_hasil: item.hasil || "-",
                satuan: item.satuan || "",
                metode: item.metode || "-",
                status_verifikasi: item.status_verifikasi,
                created_at: item.created_at
            };
        });

        // Compute summary statistics
        const stats = {
            total_sampel: formattedData.length,
            total_parameter: new Set(formattedData.map(d => d.parameter)).size,
            total_pelanggan: new Set(formattedData.map(d => d.nama_pelanggan)).size,
            total_selesai: formattedData.filter(d => d.status_verifikasi === 'DISETUJUI').length
        };

        return res.status(200).json({
            meta: {
                success: true,
                message: "Berhasil mengambil data laporan rekapitulasi pengujian"
            },
            stats,
            data: formattedData
        });
    } catch (error) {
        console.error("Get Laporan Error:", error);
        return res.status(500).json({
            meta: {
                success: false,
                message: "Terjadi kesalahan server saat mengambil data laporan"
            },
            error: error.message
        });
    }
};

module.exports = {
    getLaporan
};
