const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import function untuk menghasilkan invoice acak
const { generateRandomInvoice } = require('../utils/generateRandomInvoice');

const createTransaction = async(req, res) => {
    try {
        // Menghasilkan invoice acak
        const invoice = generateRandomInvoice();

        // Memastikan input numerik valid
        const userId = parseInt(req.user_id);
        const cash = parseInt(req.body.cash);
        const discount = parseInt(req.body.discount);
        const grandTotal = parseInt(req.body.grand_total);

        // Memeriksa nilai NaN dan mengembalikan error jika ditemukan
        if (isNaN(userId) || isNaN(cash) || isNaN(discount) || isNaN(grandTotal)) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Data input tidak valid. Silakan periksa permintaan Anda.",
                },
            });
        }

        // Menyisipkan data transaksi ke dalam database
        const transactions = await prisma.transaction.create({
            data: {
                user_id: userId,
                invoice: invoice,
                cash: cash,
                change: 0, // Perhitungan change bisa ditambahkan nanti
                discount: discount,
                grand_total: grandTotal,
            },
        });

        // Mengambil item order untuk user saat ini
        const orders = await prisma.order.findMany({
            where: { user_id: userId },
            include: { sampel: true },
        });

        // Validasi apakah ada orders
        if (orders.length === 0) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Tidak ada item dalam keranjang",
                },
            });
        }

        // Memproses setiap item keranjang
        for (const order of orders) {
            // Memastikan harga adalah float
            const price = parseFloat(order.price);

            // Menyisipkan detail transaksi dengan status true
            await prisma.transactionDetail.create({
                data: {
                    transaction_id: transactions.id,
                    sampel_id: order.sampel_id,
                    qty: order.qty,
                    price: price,
                    status_bayar: true, // UPDATE: Menambahkan status true
                },
            });
        }

        // UPDATE: Mengubah status orders menjadi true setelah transaksi berhasil
        await prisma.order.updateMany({
            where: { user_id: userId },
            data: {
                status: true
            }
        });

        // Mengirimkan response sukses
        res.status(201).send({
            meta: {
                success: true,
                message: "Transaksi berhasil dibuat",
            },
            data: transactions,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
}

module.exports = {
    createTransaction,
};