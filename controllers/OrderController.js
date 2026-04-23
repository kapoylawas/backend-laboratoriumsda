const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

const createOrder = async (req, res) => {
    try {
        const { items, pemohonan_id } = req.body; // Expecting array of items and optional pemohonan_id

        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(422).send({
                meta: {
                    success: false,
                    message: "Items array is required",
                },
            });
        }

        const results = [];

        for (const item of items) {
            const { sampel_id, qty } = item;

            // Validate each item
            if (!sampel_id || !qty) {
                results.push({
                    sampel_id,
                    success: false,
                    message: "sampel_id and qty are required"
                });
                continue;
            }

            // Convert to integer
            const sampelIdInt = parseInt(sampel_id);
            const qtyInt = parseInt(qty);

            // Validate conversion
            if (isNaN(sampelIdInt) || isNaN(qtyInt)) {
                results.push({
                    sampel_id,
                    success: false,
                    message: "sampel_id and qty must be valid numbers"
                });
                continue;
            }

            const sampel = await prisma.sampel.findUnique({
                where: { id: sampelIdInt },
            });

            if (!sampel) {
                results.push({
                    sampel_id,
                    success: false,
                    message: `Sampel dengan ID: ${sampel_id} tidak ditemukan`
                });
                continue;
            }

            // Check if order already exists for this user and sampel (regardless of status)
            const existingOrder = await prisma.order.findFirst({
                where: {
                    sampel_id: sampelIdInt,
                    user_id: req.user_id,
                },
            });

            let newOrder = null;
            let newHasil = null;
            
            try {
                // Mulai transaction untuk menjaga konsistensi data
                await prisma.$transaction(async (tx) => {
                    // Create new order dengan status false
                    newOrder = await tx.order.create({
                        data: {
                            user_id: req.user_id,
                            sampel_id: sampelIdInt,
                            qty: qtyInt,
                            price: sampel.price_sell * qtyInt,
                            status: existingOrder ? false : false // Status false untuk semua
                        },
                        include: {
                            sampel: { include: { category: true } },
                            user: { select: { id: true, name: true } },
                        },
                    });

                    // Create entry di tabel hasil dengan data yang sama
                    newHasil = await tx.hasil.create({
                        data: {
                            user_id: req.user_id,
                            sampel_id: sampelIdInt,
                            qty: qtyInt,
                            price: sampel.price_sell * qtyInt,
                            hasil: "-", // Field kosong sesuai requirement
                            metode: "-", // Field kosong sesuai requirement
                            status: false // Default false sesuai schema
                        },
                        include: {
                            sampel: { include: { category: true } },
                            user: { select: { id: true, name: true } },
                        },
                    });
                });

                results.push({
                    sampel_id,
                    success: true,
                    message: existingOrder ? 
                        "Order berhasil dibuat dengan status false (duplicate)" : 
                        "Order berhasil dibuat dengan status false",
                    data: {
                        order: newOrder,
                        hasil: newHasil,
                        pemohonan_id: pemohonan_id || null
                    }
                });

            } catch (createError) {
                results.push({
                    sampel_id,
                    success: false,
                    message: `Gagal membuat order dan hasil: ${createError.message}`
                });
            }
        }

        // Check if all operations were successful
        const allSuccess = results.every(result => result.success);

        return res.status(allSuccess ? 201 : 207).send({
            meta: {
                success: allSuccess,
                message: allSuccess ?
                    "Semua order dan hasil berhasil diproses" : 
                    "Beberapa order/hasil mengalami masalah",
            },
            data: results,
        });

    } catch (error) {
        console.error("Error in createOrder:", error);
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
}

const findOrderByUserId = async (req, res) => {
    const { id } = req.params;

    // Validasi ID
    if (!id || isNaN(Number(id))) {
        return res.status(400).send({
            meta: {
                success: false,
                message: "ID user tidak valid",
            },
        });
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                user_id: Number(id),
            },
            select: {
                id: true,
                sampel_id: true,
                qty: true,
                price: true,
                status: true,
                created_at: true,
                updated_at: true,
                user: {
                    select: {
                        name: true
                    }
                },
                sampel: {
                    select: {
                        category_id: true,
                        parameter: true,
                        price_sell: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
        });

        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mengambil order dengan user ID: ${id}`,
            },
            data: orders,
        });
    } catch (error) {
        console.error("Error details:", error);

        res.status(500).send({
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            errors: process.env.NODE_ENV === 'development' ? error.message : "Terjadi kesalahan",
        });
    }
}

const deleteOrder = async (req, res) => {
    // Mendapatkan ID dari params
    const { id } = req.params;

    // Validasi input
    if (!id || isNaN(Number(id))) {
        return res.status(400).send({
            meta: {
                success: false,
                message: "ID order tidak valid",
            },
        });
    }

    if (!req.user_id || isNaN(parseInt(req.user_id))) {
        return res.status(401).send({
            meta: {
                success: false,
                message: "User ID tidak valid",
            },
        });
    }

    try {
        // Konversi ke number sekali saja
        const orderId = Number(id);
        const userId = parseInt(req.user_id);

        // console.log(`Mencari order ID: ${orderId} untuk user ID: ${userId}`);

        // Cari data hasil terkait dengan order ini terlebih dahulu
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                user_id: userId,
            },
            include: {
                sampel: true,
            },
        });

        // console.log("Hasil pencarian order:", order);

        if (!order) {
            // Debug: Cek apakah order ada tanpa filter user
            const anyOrder = await prisma.order.findUnique({
                where: { id: orderId }
            });

            // console.log("Order tanpa filter user:", anyOrder);

            if (anyOrder) {
                return res.status(403).send({
                    meta: {
                        success: false,
                        message: `Order dengan ID: ${id} tidak dimiliki oleh user ini`,
                    },
                });
            }

            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Order dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Cari data hasil berdasarkan sampel_id dan user_id yang sama
        const hasilData = await prisma.hasil.findFirst({
            where: {
                sampel_id: order.sampel_id,
                user_id: userId,
                qty: order.qty,
            },
        });

        // console.log("Data hasil yang ditemukan:", hasilData);

        // Gunakan transaction untuk menghapus kedua data secara atomik
        const deletedData = await prisma.$transaction(async (tx) => {
            // 1. Hapus data hasil jika ada
            let deletedHasil = null;
            if (hasilData) {
                deletedHasil = await tx.hasil.delete({
                    where: {
                        id: hasilData.id,
                    },
                });
                // console.log(`Hasil dengan ID: ${hasilData.id} berhasil dihapus`);
            }

            // 2. Hapus order
            const deletedOrder = await tx.order.delete({
                where: {
                    id: orderId,
                    user_id: userId
                },
            });
            // console.log(`Order dengan ID: ${orderId} berhasil dihapus`);

            return {
                deletedOrder,
                deletedHasil
            };
        });

        // Mengirimkan respon
        res.status(200).send({
            meta: {
                success: true,
                message: hasilData ? 
                    "Order dan hasil terkait berhasil dihapus" : 
                    "Order berhasil dihapus",
            },
            data: {
                deleted_order_id: orderId,
                deleted_hasil_id: hasilData?.id || null,
                sampel_id: order.sampel_id,
                qty: order.qty
            }
        });

    } catch (error) {
        console.error("Error dalam deleteOrder:", error);

        // Handle Prisma specific errors
        if (error.code === 'P2025') {
            const errorMessage = error.message.includes('hasil') ? 
                "Data hasil tidak ditemukan atau sudah dihapus" :
                "Order tidak ditemukan atau sudah dihapus";
            
            return res.status(404).send({
                meta: {
                    success: false,
                    message: errorMessage,
                },
            });
        }

        // Handle foreign key constraint errors
        if (error.code === 'P2003') {
            return res.status(409).send({
                meta: {
                    success: false,
                    message: "Tidak dapat menghapus order karena masih terkait dengan data lain",
                },
            });
        }

        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

module.exports = {
    createOrder,
    findOrderByUserId,
    deleteOrder
}