const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

const createOrder = async(req, res) => {
    try {
        const { items } = req.body; // Expecting array of items

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

            const sampel = await prisma.sampel.findUnique({
                where: { id: parseInt(sampel_id) },
            });

            if (!sampel) {
                results.push({
                    sampel_id,
                    success: false,
                    message: `Sampel dengan ID: ${sampel_id} tidak ditemukan`
                });
                continue;
            }

            // Check if order already exists
            const existingOrder = await prisma.order.findFirst({
                where: {
                    sampel_id: parseInt(sampel_id),
                    user_id: req.user_id,
                },
            });

            if (existingOrder) {
                // Update existing order
                const updatedOrder = await prisma.order.update({
                    where: { id: existingOrder.id },
                    data: {
                        qty: existingOrder.qty + parseInt(qty),
                        price: sampel.price_sell * (existingOrder.qty + parseInt(qty)),
                        updated_at: new Date(),
                    },
                    include: {
                        sampel: { include: { category: true } },
                        user: { select: { id: true, name: true } },
                    },
                });

                results.push({
                    sampel_id,
                    success: true,
                    message: "Jumlah order berhasil diperbarui",
                    data: updatedOrder
                });
            } else {
                // Create new order
                const newOrder = await prisma.order.create({
                    data: {
                        user_id: req.user_id,
                        sampel_id: parseInt(sampel_id),
                        qty: parseInt(qty),
                        price: sampel.price_sell * parseInt(qty),
                    },
                    include: {
                        sampel: { include: { category: true } },
                        user: { select: { id: true, name: true } },
                    },
                });

                results.push({
                    sampel_id,
                    success: true,
                    message: "Order berhasil dibuat",
                    data: newOrder
                });
            }
        }

        // Check if all operations were successful
        const allSuccess = results.every(result => result.success);

        return res.status(allSuccess ? 201 : 207).send({
            meta: {
                success: allSuccess,
                message: allSuccess ?
                    "Semua order berhasil diproses" : "Beberapa order mengalami masalah",
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

const findOrderByUserId = async(req, res) => {
    // Mengambil ID dari parameter
    const { id } = req.params;

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
                        category: { // Join ke tabel category
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
        });


        // Mengirim respons
        res.status(200).send({
            meta: {
                success: true,
                message: `Berhasil mengambil sampel dengan user ID: ${id} )`,
            },
            data: orders,
        });
    } catch (error) {
        // Mengirim respons jika terjadi kesalahan
        res.status(500).send({
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            errors: error,
        });
    }
}

const deleteOrder = async(req, res) => {
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

        console.log(`Mencari order ID: ${orderId} untuk user ID: ${userId}`);

        // Mendapatkan data order yang akan dihapus
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                user_id: userId,
            },
        });

        console.log("Hasil pencarian order:", order);

        if (!order) {
            // Debug: Cek apakah order ada tanpa filter user
            const anyOrder = await prisma.order.findUnique({
                where: { id: orderId }
            });

            console.log("Order tanpa filter user:", anyOrder);

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

        // Menghapus order
        await prisma.order.delete({
            where: {
                id: orderId,
                user_id: userId
            },
        });

        console.log(`Order dengan ID: ${orderId} berhasil dihapus`);

        // Mengirimkan respon
        res.status(200).send({
            meta: {
                success: true,
                message: "Order berhasil dihapus",
            },
            data: {
                deleted_order_id: orderId
            }
        });

    } catch (error) {
        console.error("Error dalam deleteOrder:", error);

        // Handle Prisma specific errors
        if (error.code === 'P2025') {
            return res.status(404).send({
                meta: {
                    success: false,
                    message: "Order tidak ditemukan atau sudah dihapus",
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