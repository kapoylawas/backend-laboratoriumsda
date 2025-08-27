const express = require("express");

// Import prisma client
const prisma = require("../prisma/client");

const createOrder = async (req, res) => {
    try {
        const sampel = await prisma.sampel.findUnique({
            where: {
                id: parseInt(req.body.sampel_id),
            },
        });

        // jika sampel tidak ada atau kosong
        if (!sampel) {
            // Jika sampel tidak ada, kembalikan error 404
            return res.status(404).send({
                meta: {
                    success: false,
                    message: `Sempel dengan ID: ${req.body.sampel_id} tidak ditemukan`,
                },
            });
        }

        // Memeriksa apakah item order dengan sampel_id dan user_id yang sama sudah ada
        const existingCart = await prisma.order.findFirst({
            where: {
                sampel_id: parseInt(req.body.sampel_id),
                user_id: req.user_id,
            },
        });

        if (existingCart) {
            // Jika item keranjang sudah ada, tambahkan jumlahnya
            const updatedOrder = await prisma.order.update({
                where: {
                    id: existingCart.id,
                },
                data: {
                    qty: existingCart.qty + parseInt(req.body.qty),
                    price: sampel.price_sell * (existingCart.qty + parseInt(req.body.qty)),
                    updated_at: new Date(),
                },
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
                        },
                    },
                },
            });
            // Mengirimkan respon untuk keranjang yang diperbarui
            return res.status(200).send({
                meta: {
                    success: true,
                    message: "Jumlah keranjang berhasil diperbarui",
                },
                data: updatedOrder,
            });
        } else {
            // Jika item order belum ada, buat yang baru
            const orders = await prisma.order.create({
                data: {
                    user_id: req.user_id,
                    sampel_id: parseInt(req.body.sampel_id),
                    qty: parseInt(req.body.qty),
                    price: sampel.price_sell * parseInt(req.body.qty),
                },
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
                        },
                    },
                },
            });
            // Mengirimkan respon untuk keranjang yang baru dibuat
            return res.status(201).send({
                meta: {
                    success: true,
                    message: "Order berhasil dibuat",
                },
                data: orders,
            });
        }
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error,
        });
    }
}

module.exports = {
    createOrder
}