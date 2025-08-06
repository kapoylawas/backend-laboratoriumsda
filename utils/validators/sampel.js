const { body, check } = require("express-validator");

// Import prisma client
const prisma = require('../../prisma/client');

const validateSampel = [
    body("category_id").notEmpty().withMessage("Category is required"),
    body("parameter").notEmpty().withMessage("Category is required"),
    body("price_sell").notEmpty().withMessage("Harga is required"),
]

module.exports = { validateSampel };