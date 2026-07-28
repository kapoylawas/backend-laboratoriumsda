const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultStockOpnameItems = [
    { nama_bmhp: "Air Pepton", satuan: "500 gr", harga_satuan: 1425124, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Jan-26", lot: "VM955028 103", lokasi: "E" },
    { nama_bmhp: "Alkohol 96%", satuan: "1 L", harga_satuan: 66000, stock_awal: 3, penerimaan: 0, pemakaian: 0, ed: "-", lot: "-", lokasi: "H" },
    { nama_bmhp: "Alkohol Swab", satuan: "Kotak", harga_satuan: 11000, stock_awal: 183, penerimaan: 0, pemakaian: 0, ed: "Nov-27", lot: "202211", lokasi: "H" },
    { nama_bmhp: "Aluminium Standart Solution", satuan: "Pcs", harga_satuan: 1065600, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Jun-27", lot: "HC32535870", lokasi: "H" },
    { nama_bmhp: "Amies", satuan: "Pcs", harga_satuan: 2553000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "May-28", lot: "30140525", lokasi: "H" },
    { nama_bmhp: "Amonia", satuan: "Kit", harga_satuan: 1500000, stock_awal: 4, penerimaan: 0, pemakaian: 0, ed: "Jul-27", lot: "FF043/FF044", lokasi: "H" },
    { nama_bmhp: "Amonium Standart", satuan: "Pcs", harga_satuan: 1509600, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Nov-26", lot: "HC3532112", lokasi: "H" },
    { nama_bmhp: "Amonium Test", satuan: "Pcs", harga_satuan: 6882000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Nov-26", lot: "HC336688", lokasi: "H" },
    { nama_bmhp: "Aquades Non Steril", satuan: "20 L", harga_satuan: 107470, stock_awal: 15, penerimaan: 0, pemakaian: 0, ed: "-", lot: "-", lokasi: "H" },
    { nama_bmhp: "Arsen", satuan: "Kit", harga_satuan: 6336990, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Dec-26", lot: "HC442874", lokasi: "H" },
    { nama_bmhp: "Arsenic Standart Solution", satuan: "Pcs", harga_satuan: 1032300, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Feb-28", lot: "HC44404373", lokasi: "H" },
    { nama_bmhp: "Asam Asetat 5%", satuan: "Botol", harga_satuan: 14208, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Apr-26", lot: "25052388", lokasi: "H" },
    { nama_bmhp: "Asam Asetat 5%", satuan: "Botol", harga_satuan: 14208, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Apr-28", lot: "02052588", lokasi: "H" },
    { nama_bmhp: "Blood Lancet", satuan: "Kotak", harga_satuan: 9000, stock_awal: 189, penerimaan: 0, pemakaian: 0, ed: "-", lot: "-", lokasi: "H" },
    { nama_bmhp: "Blue Tip", satuan: "Pak", harga_satuan: 42200, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Jan-27", lot: "-", lokasi: "B" },
    { nama_bmhp: "Borax Test", satuan: "Kit", harga_satuan: 1332000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Aug-27", lot: "B002.50", lokasi: "H" },
    { nama_bmhp: "Brilliant Green Lactose Broth", satuan: "Pcs", harga_satuan: 2652900, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Jan-29", lot: "VM1077754407", lokasi: "H" },
    { nama_bmhp: "Buffered Pepton Water", satuan: "500 gr", harga_satuan: 1600000, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Jun-28", lot: "VM1052328 324", lokasi: "E" },
    { nama_bmhp: "Buffered Pepton Water", satuan: "Pcs", harga_satuan: 1576200, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Jan-30", lot: "VM121228507", lokasi: "H" },
    { nama_bmhp: "Chlorine Test", satuan: "Kit", harga_satuan: 8112990, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Sep-26", lot: "HC457921", lokasi: "H" },
    { nama_bmhp: "Chloroform", satuan: "Botol", harga_satuan: 851000, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Oct-26", lot: "k55638945348", lokasi: "H" },
    { nama_bmhp: "Chopper Standart Solution", satuan: "Pcs", harga_satuan: 1087800, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Jan-29", lot: "HC56433686", lokasi: "H" },
    { nama_bmhp: "Chromate Test", satuan: "Pcs", harga_satuan: 5994000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "May-28", lot: "HC588814", lokasi: "H" },
    { nama_bmhp: "Coliform Agar (Cromocult)", satuan: "500 gr", harga_satuan: 11000000, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Jul-28", lot: "VM1055326 329", lokasi: "E" },
    { nama_bmhp: "Cotton Swab", satuan: "100 pcs/kotak", harga_satuan: 55482, stock_awal: 27, penerimaan: 0, pemakaian: 0, ed: "Feb-25", lot: "30032088", lokasi: "H" },
    { nama_bmhp: "Cotton Swab", satuan: "pcs", harga_satuan: 1188, stock_awal: 100, penerimaan: 0, pemakaian: 0, ed: "Aug-28", lot: "27092388", lokasi: "H" },
    { nama_bmhp: "Cyclamate", satuan: "Pcs", harga_satuan: 2553000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Dec-27", lot: "CLMT10100", lokasi: "H" },
    { nama_bmhp: "Eosin Methylean Blue Agar", satuan: "500 gr", harga_satuan: 1350000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Dec-25", lot: "VM952858 102", lokasi: "E" },
    { nama_bmhp: "Eosin Methylean Blue Agar", satuan: "500 gr", harga_satuan: 4300000, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Jul-27", lot: "VM1024358 230", lokasi: "E" },
    { nama_bmhp: "Etanol 70%", satuan: "1 L", harga_satuan: 26418, stock_awal: 22, penerimaan: 0, pemakaian: 0, ed: "Jun-28", lot: "01072488", lokasi: "H" },
    { nama_bmhp: "Flourida", satuan: "Kit", harga_satuan: 3120000, stock_awal: 4, penerimaan: 0, pemakaian: 0, ed: "Apr-26", lot: "EC140/ED035", lokasi: "H" },
    { nama_bmhp: "Fluoride Standart", satuan: "Kit", harga_satuan: 1180000, stock_awal: 3, penerimaan: 0, pemakaian: 0, ed: "Feb-28", lot: "BCCM9122", lokasi: "H" },
    { nama_bmhp: "Fluoride Test", satuan: "Kit", harga_satuan: 2830500, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Aug-27", lot: "HC456663", lokasi: "H" },
    { nama_bmhp: "Fluoride Test", satuan: "Kit", harga_satuan: 2830500, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Jun-27", lot: "HC434730", lokasi: "H" },
    { nama_bmhp: "Formaldehid", satuan: "1 L", harga_satuan: 125000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "-", lot: "-", lokasi: "H" },
    { nama_bmhp: "Formaldehid", satuan: "Kit", harga_satuan: 1443000, stock_awal: 2, penerimaan: 0, pemakaian: 0, ed: "Jul-27", lot: "F001.50", lokasi: "H" },
    { nama_bmhp: "Fuchsin", satuan: "25 gr", harga_satuan: 2669876, stock_awal: 5, penerimaan: 0, pemakaian: 0, ed: "Jul-27", lot: "0001238878", lokasi: "H" },
    { nama_bmhp: "Gentamicin Salep", satuan: "Tube", harga_satuan: 3325, stock_awal: 24, penerimaan: 0, pemakaian: 0, ed: "Jan-26", lot: "LCB02853", lokasi: "H" },
    { nama_bmhp: "Handscoon", satuan: "100 pcs/kotak", harga_satuan: 145000, stock_awal: 107, penerimaan: 0, pemakaian: 0, ed: "-", lot: "33332132", lokasi: "H" },
    { nama_bmhp: "Handscoon Panjang", satuan: "Pasang", harga_satuan: 43010, stock_awal: 80, penerimaan: 0, pemakaian: 0, ed: "Sep-25", lot: "16853-01", lokasi: "H" },
    { nama_bmhp: "Hazmat", satuan: "pcs", harga_satuan: 93742, stock_awal: 20, penerimaan: 0, pemakaian: 0, ed: "Dec-26", lot: "-", lokasi: "H" },
    { nama_bmhp: "Hidrokortison 2,5 %", satuan: "Tube", harga_satuan: 4225, stock_awal: 22, penerimaan: 0, pemakaian: 0, ed: "Sep-26", lot: "245J019", lokasi: "H" },
    { nama_bmhp: "Hydrochloric Acid Fuming 37%", satuan: "2,5 L", harga_satuan: 963702, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "Mar-25", lot: "K52364917015", lokasi: "B" },
    { nama_bmhp: "Hydrochloric Acid Fuming 37%", satuan: "2,5 L", harga_satuan: 912740, stock_awal: 1, penerimaan: 0, pemakaian: 0, ed: "May-29", lot: "934817", lokasi: "H" },
    { nama_bmhp: "Ibu Profen", satuan: "Tablet", harga_satuan: 185, stock_awal: 90, penerimaan: 0, pemakaian: 0, ed: "Apr-28", lot: "2404-03-134", lokasi: "H" },
    { nama_bmhp: "Indikator Ph Universal", satuan: "100 lembar/pak", harga_satuan: 64350, stock_awal: 8, penerimaan: 0, pemakaian: 0, ed: "-", lot: "-", lokasi: "H" }
];

// Seed function helper
const runSeedIfEmpty = async () => {
    const count = await prisma.stockOpname.count();
    if (count === 0) {
        console.log("Seeding default Stock Opname data...");
        for (const item of defaultStockOpnameItems) {
            const stock_awal = Number(item.stock_awal) || 0;
            const penerimaan = Number(item.penerimaan) || 0;
            const pemakaian = Number(item.pemakaian) || 0;
            const sisa_stock = stock_awal + penerimaan - pemakaian;
            const harga_satuan = Number(item.harga_satuan) || 0;
            const nilai = sisa_stock * harga_satuan;

            await prisma.stockOpname.create({
                data: {
                    ...item,
                    stock_awal,
                    penerimaan,
                    pemakaian,
                    sisa_stock,
                    nilai,
                    periode: "SALDO AWAL 2026",
                    upt: "LABKESDA",
                    kecamatan: "GEDANGAN",
                    kabupaten: "SIDOARJO"
                }
            });
        }
        console.log("Seeding complete!");
    }
};

// Auto seed on controller module load
runSeedIfEmpty().catch(err => console.error("Auto seed stock opname failed:", err));

/**
 * Get all Stock Opname items with filters, search, and pagination
 */
const findStockOpnames = async (req, res) => {
    try {
        const { search, periode, lokasi, page = 1, limit = 100 } = req.query;

        const whereClause = {};

        if (search) {
            whereClause.OR = [
                { nama_bmhp: { contains: search } },
                { lot: { contains: search } },
                { lokasi: { contains: search } },
                { ed: { contains: search } }
            ];
        }

        if (periode) {
            whereClause.periode = periode;
        }

        if (lokasi) {
            whereClause.lokasi = lokasi;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const [items, totalItems] = await Promise.all([
            prisma.stockOpname.findMany({
                where: whereClause,
                orderBy: { id: 'asc' },
                skip,
                take
            }),
            prisma.stockOpname.count({ where: whereClause })
        ]);

        // Calculate summary stats for response
        const allMatchingItems = await prisma.stockOpname.findMany({
            where: whereClause
        });

        const stats = allMatchingItems.reduce((acc, curr) => {
            acc.total_item += 1;
            acc.total_stock_awal += curr.stock_awal;
            acc.total_penerimaan += curr.penerimaan;
            acc.total_pemakaian += curr.pemakaian;
            acc.total_sisa_stock += curr.sisa_stock;
            acc.total_nilai += curr.nilai;
            return acc;
        }, {
            total_item: 0,
            total_stock_awal: 0,
            total_penerimaan: 0,
            total_pemakaian: 0,
            total_sisa_stock: 0,
            total_nilai: 0
        });

        return res.status(200).send({
            success: true,
            message: "Berhasil mengambil data stock opname",
            data: items,
            stats,
            meta: {
                current_page: Number(page),
                last_page: Math.ceil(totalItems / limit),
                total: totalItems
            }
        });
    } catch (error) {
        console.error("findStockOpnames Error:", error);
        return res.status(500).send({
            success: false,
            message: "Terjadi kesalahan server saat mengambil data stock opname",
            error: error.message
        });
    }
};

/**
 * Get Stock Opname item by ID
 */
const findStockOpnameById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.stockOpname.findUnique({
            where: { id: Number(id) }
        });

        if (!item) {
            return res.status(404).send({
                success: false,
                message: "Data stock opname tidak ditemukan"
            });
        }

        return res.status(200).send({
            success: true,
            message: "Berhasil mengambil detail stock opname",
            data: item
        });
    } catch (error) {
        console.error("findStockOpnameById Error:", error);
        return res.status(500).send({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
};

/**
 * Create new Stock Opname item
 */
const createStockOpname = async (req, res) => {
    try {
        const {
            nama_bmhp,
            satuan,
            harga_satuan,
            stock_awal = 0,
            penerimaan = 0,
            pemakaian = 0,
            ed = "-",
            lot = "-",
            lokasi = "H",
            periode = "SALDO AWAL 2026",
            upt = "LABKESDA",
            kecamatan = "GEDANGAN",
            kabupaten = "SIDOARJO",
            catatan = ""
        } = req.body;

        const numStockAwal = Number(stock_awal) || 0;
        const numPenerimaan = Number(penerimaan) || 0;
        const numPemakaian = Number(pemakaian) || 0;
        const numHargaSatuan = Number(harga_satuan) || 0;

        const sisa_stock = numStockAwal + numPenerimaan - numPemakaian;
        const nilai = sisa_stock * numHargaSatuan;

        const newItem = await prisma.stockOpname.create({
            data: {
                nama_bmhp,
                satuan,
                harga_satuan: numHargaSatuan,
                stock_awal: numStockAwal,
                penerimaan: numPenerimaan,
                pemakaian: numPemakaian,
                sisa_stock,
                nilai,
                ed: ed || "-",
                lot: lot || "-",
                lokasi: lokasi || "H",
                periode: periode || "SALDO AWAL 2026",
                upt: upt || "LABKESDA",
                kecamatan: kecamatan || "GEDANGAN",
                kabupaten: kabupaten || "SIDOARJO",
                catatan: catatan || ""
            }
        });

        return res.status(201).send({
            success: true,
            message: "Berhasil menambahkan data stock opname baru",
            data: newItem
        });
    } catch (error) {
        console.error("createStockOpname Error:", error);
        return res.status(500).send({
            success: false,
            message: "Gagal membuat data stock opname baru",
            error: error.message
        });
    }
};

/**
 * Update Stock Opname item
 */
const updateStockOpname = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nama_bmhp,
            satuan,
            harga_satuan,
            stock_awal,
            penerimaan,
            pemakaian,
            ed,
            lot,
            lokasi,
            periode,
            upt,
            kecamatan,
            kabupaten,
            catatan
        } = req.body;

        const existing = await prisma.stockOpname.findUnique({
            where: { id: Number(id) }
        });

        if (!existing) {
            return res.status(404).send({
                success: false,
                message: "Data stock opname tidak ditemukan"
            });
        }

        const numStockAwal = stock_awal !== undefined ? Number(stock_awal) : existing.stock_awal;
        const numPenerimaan = penerimaan !== undefined ? Number(penerimaan) : existing.penerimaan;
        const numPemakaian = pemakaian !== undefined ? Number(pemakaian) : existing.pemakaian;
        const numHargaSatuan = harga_satuan !== undefined ? Number(harga_satuan) : existing.harga_satuan;

        const sisa_stock = numStockAwal + numPenerimaan - numPemakaian;
        const nilai = sisa_stock * numHargaSatuan;

        const updatedItem = await prisma.stockOpname.update({
            where: { id: Number(id) },
            data: {
                nama_bmhp: nama_bmhp || existing.nama_bmhp,
                satuan: satuan || existing.satuan,
                harga_satuan: numHargaSatuan,
                stock_awal: numStockAwal,
                penerimaan: numPenerimaan,
                pemakaian: numPemakaian,
                sisa_stock,
                nilai,
                ed: ed !== undefined ? ed : existing.ed,
                lot: lot !== undefined ? lot : existing.lot,
                lokasi: lokasi !== undefined ? lokasi : existing.lokasi,
                periode: periode !== undefined ? periode : existing.periode,
                upt: upt !== undefined ? upt : existing.upt,
                kecamatan: kecamatan !== undefined ? kecamatan : existing.kecamatan,
                kabupaten: kabupaten !== undefined ? kabupaten : existing.kabupaten,
                catatan: catatan !== undefined ? catatan : existing.catatan
            }
        });

        return res.status(200).send({
            success: true,
            message: "Berhasil memperbarui data stock opname",
            data: updatedItem
        });
    } catch (error) {
        console.error("updateStockOpname Error:", error);
        return res.status(500).send({
            success: false,
            message: "Gagal memperbarui data stock opname",
            error: error.message
        });
    }
};

/**
 * Delete Stock Opname item
 */
const deleteStockOpname = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.stockOpname.findUnique({
            where: { id: Number(id) }
        });

        if (!existing) {
            return res.status(404).send({
                success: false,
                message: "Data stock opname tidak ditemukan"
            });
        }

        await prisma.stockOpname.delete({
            where: { id: Number(id) }
        });

        return res.status(200).send({
            success: true,
            message: "Berhasil menghapus data stock opname"
        });
    } catch (error) {
        console.error("deleteStockOpname Error:", error);
        return res.status(500).send({
            success: false,
            message: "Gagal menghapus data stock opname",
            error: error.message
        });
    }
};

/**
 * Reset and seed default 46 items from sample report
 */
const seedStockOpname = async (req, res) => {
    try {
        const { forceReset = false } = req.body;

        if (forceReset) {
            await prisma.stockOpname.deleteMany({});
        }

        let createdCount = 0;
        for (const item of defaultStockOpnameItems) {
            const stock_awal = Number(item.stock_awal) || 0;
            const penerimaan = Number(item.penerimaan) || 0;
            const pemakaian = Number(item.pemakaian) || 0;
            const sisa_stock = stock_awal + penerimaan - pemakaian;
            const harga_satuan = Number(item.harga_satuan) || 0;
            const nilai = sisa_stock * harga_satuan;

            await prisma.stockOpname.create({
                data: {
                    ...item,
                    stock_awal,
                    penerimaan,
                    pemakaian,
                    sisa_stock,
                    nilai,
                    periode: "SALDO AWAL 2026",
                    upt: "LABKESDA",
                    kecamatan: "GEDANGAN",
                    kabupaten: "SIDOARJO"
                }
            });
            createdCount++;
        }

        return res.status(200).send({
            success: true,
            message: `Berhasil me-seed ${createdCount} data sampel stock opname`
        });
    } catch (error) {
        console.error("seedStockOpname Error:", error);
        return res.status(500).send({
            success: false,
            message: "Gagal me-seed data sampel stock opname",
            error: error.message
        });
    }
};

/**
 * Get Report data formatted for official print layout
 */
const getStockOpnameReport = async (req, res) => {
    try {
        const { periode = "SALDO AWAL 2026" } = req.query;

        const items = await prisma.stockOpname.findMany({
            where: periode ? { periode } : {},
            orderBy: { id: 'asc' }
        });

        const stats = items.reduce((acc, curr) => {
            acc.total_item += 1;
            acc.total_stock_awal += curr.stock_awal;
            acc.total_penerimaan += curr.penerimaan;
            acc.total_pemakaian += curr.pemakaian;
            acc.total_sisa_stock += curr.sisa_stock;
            acc.total_nilai += curr.nilai;
            return acc;
        }, {
            total_item: 0,
            total_stock_awal: 0,
            total_penerimaan: 0,
            total_pemakaian: 0,
            total_sisa_stock: 0,
            total_nilai: 0
        });

        const firstItem = items[0] || {};

        return res.status(200).send({
            success: true,
            header: {
                title: "LAPORAN PENERIMAAN & PENGELUARAN REAGEN & BMHP",
                instansi: "UPTD LABKESDA SIDOARJO",
                upt: firstItem.upt || "LABKESDA",
                kecamatan: firstItem.kecamatan || "GEDANGAN",
                kabupaten: firstItem.kabupaten || "SIDOARJO",
                periode: periode || firstItem.periode || "SALDO AWAL 2026"
            },
            data: items,
            stats
        });
    } catch (error) {
        console.error("getStockOpnameReport Error:", error);
        return res.status(500).send({
            success: false,
            message: "Gagal mengambil data laporan stock opname",
            error: error.message
        });
    }
};

module.exports = {
    findStockOpnames,
    findStockOpnameById,
    createStockOpname,
    updateStockOpname,
    deleteStockOpname,
    seedStockOpname,
    getStockOpnameReport
};
