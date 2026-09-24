const verifyToken = require('./auth');
const upload = require('./upload');
const handleValidationErrors = require('./handleValidationErrors');
const checkRole = require('./checkRole');
const { loginLimiter, registerLimiter, apiLimiter } = require('./rateLimiter');

//export middleware
module.exports = { 
    verifyToken, 
    upload, 
    handleValidationErrors, 
    checkRole,
    loginLimiter,
    registerLimiter,
    apiLimiter
};