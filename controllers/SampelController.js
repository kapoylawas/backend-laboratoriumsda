const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

const createSampel = async (req, res) => {
    try {
        const sampels = await prisma.sampel.create({
            data: {
                category_id: parseInt(req.body.category_id),
                parameter: req.body.parameter,
                price_sell: parseInt(req.body.price_sell),
            },
            include: {
                category: true,
            }
        });
        // Mengirim respons
        res.status(201).send({
            //meta untuk respons JSON
            meta: {
                success: true,
                message: "Produk berhasil dibuat",
            },
            //data produk
            data: sampels,
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk respons JSON
            meta: {
                success: false,
                message: "Kesalahan internal server",
            },
            //data kesalahan
            errors: error,
        });
    }
}

module.exports = { createSampel };