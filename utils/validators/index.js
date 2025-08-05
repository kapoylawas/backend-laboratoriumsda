const { validateLogin } = require("./auth");
const { validateCategory } = require("./category");
const { validateUser } = require("./user");

//export validator
module.exports = {
    validateLogin,
    validateUser,
    validateCategory,
};