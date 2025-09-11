const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

const createOrder = async (req, res) => {
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

const findOrderByUserId = async (req, res) => {
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

module.exports = {
    createOrder,
    findOrderByUserId
}