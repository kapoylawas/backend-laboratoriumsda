const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import function untuk menghasilkan invoice acak
const { generateRandomInvoice } = require('../utils/generateRandomInvoice');

const createTransaction = async (req, res) => {
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

        // Mengambil item order yang BELUM dibayar untuk user saat ini
        const orders = await prisma.order.findMany({
            where: {
                user_id: userId,
                status: false // HANYA ambil yang belum dibayar
            },
            include: { sampel: true },
        });

        // Validasi apakah ada orders yang belum dibayar
        if (orders.length === 0) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Tidak ada item dalam keranjang",
                },
            });
        }

        // Menyisipkan data transaksi ke dalam database
        const transactions = await prisma.transaction.create({
            data: {
                user_id: userId,
                invoice: invoice,
                cash: cash,
                change: cash - grandTotal, // Perhitungan change yang benar
                discount: discount,
                grand_total: grandTotal,
            },
        });

        // Memproses setiap item keranjang yang belum dibayar
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
                    status_bayar: true,
                },
            });
        }

        // UPDATE: Mengubah status orders menjadi true setelah transaksi berhasil
        await prisma.order.updateMany({
            where: {
                user_id: userId,
                status: false // HANYA update yang belum dibayar
            },
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

const findTransactionsByUserID = async (req, res) => {
    const { id } = req.params;

    // Validasi input
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    try {
        // Cek apakah user exists
        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                id: true
            }
        });

        // Jika user tidak ditemukan
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                user_id: parseInt(id)
            },
            select: {
                id: true,
                invoice: true,
                grand_total: true,
                created_at: true,
                user: {
                    select: {
                        name: true
                    }
                },
                transaction_details: {
                    select: {
                        id: true,
                        transaction_id: true,
                        sampel_id: true,
                        price: true,
                        status_bayar: true,
                        sampel: {
                            select: {
                                parameter: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Jika tidak ada transaksi ditemukan
        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No transactions found for this user"
            });
        }

        // Response sukses
        return res.status(200).json({
            success: true,
            message: "Transactions retrieved successfully",
            data: transactions
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);

        // Handle error khusus untuk ID tidak valid
        if (error.code === 'P2023') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // Handle error umum
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const findTransactionByID = async (req, res) => {
    const { id } = req.params;

    // Validasi input
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Transaction ID is required"
        });
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                id: true,
                invoice: true,
                grand_total: true,
                created_at: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                transaction_details: {
                    select: {
                        id: true,
                        transaction_id: true,
                        sampel_id: true,
                        price: true,
                        status_bayar: true,
                        sampel: {
                            select: {
                                parameter: true,
                                // Hapus field 'code' dan gunakan field yang tersedia
                                // Sesuaikan dengan field yang ada di model Sampel
                                id: true,
                                category_id: true,
                                price_sell: true
                                // Tambahkan field lain yang diperlukan dari model Sampel
                            }
                        }
                    }
                }
            }
        });

        // Jika transaction tidak ditemukan
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        // Response sukses
        return res.status(200).json({
            success: true,
            message: "Transaction retrieved successfully",
            data: transaction
        });

    } catch (error) {
        console.error("Error fetching transaction:", error);

        // Handle error khusus untuk ID tidak valid
        if (error.code === 'P2023') {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID format"
            });
        }

        // Handle error umum
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = {
    createTransaction,
    findTransactionsByUserID,
    findTransactionByID
};