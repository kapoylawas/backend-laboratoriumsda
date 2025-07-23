const { validateLogin } = require("./auth");
const { validateUser } = require("./user");

//export validator
module.exports = {
    validateLogin,
    validateUser,
};