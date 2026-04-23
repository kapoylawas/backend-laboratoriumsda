const { validateLogin } = require("./auth");
const { validateCategory } = require("./category");
const { validateHasil } = require("./hasil");
const { validateOrder } = require("./order");
const { validateSampel } = require("./sampel");
const { validateUser } = require("./user");
const { validatePemohonan } = require("./pemohonan");

//export validator
module.exports = {
    validateLogin,
    validateUser,
    validateCategory,
    validateSampel,
    validateOrder,
    validateHasil,
    validatePemohonan,
};