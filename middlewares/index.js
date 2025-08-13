const verifyToken = require('./auth');
const upload = require('./upload');
const handleValidationErrors = require('./handleValidationErrors');
const checkRole = require('./checkRole');

//export middleware
module.exports = { verifyToken, upload, handleValidationErrors, checkRole }