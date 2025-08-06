const { validateLogin } = require("./auth");
const { validateCategory } = require("./category");
const { validateSampel } = require("./sampel");
const { validateUser } = require("./user");

//export validator
module.exports = {
    validateLogin,
    validateUser,
    validateCategory,
    validateSampel
};