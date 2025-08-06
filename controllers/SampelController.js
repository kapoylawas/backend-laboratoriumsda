const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

const createSampel = async (req, res) => {
    try {
        const sampel = await prisma.sampel.create({
            data: {
                category_id: parseInt(req.body.category_id),
                parameter: req.body.barcode,
                price_sell: parseInt(req.body.sell_price),
            },
            include: {
                category: true,
            }
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