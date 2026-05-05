const express = require('express');

// Init express router
const router = express.Router();

// Import validators and middleware
const { validateLogin, validateUser, validateCategory, validateSampel, validateOrder, validateHasil, validatePemohonan, validateJadwalPengambilan } = require('../utils/validators');
const { handleValidationErrors, verifyToken, checkRole } = require('../middlewares');

// Import controllers
const loginController = require('../controllers/LoginController');
const userController = require('../controllers/UserController');
const roleController = require('../controllers/RoleController');
const categoryController = require('../controllers/CategoryController');
const sampelController = require('../controllers/SampelController');
const orderController = require('../controllers/OrderController');
const transactionController = require('../controllers/TransactionController');
const hasilsController = require('../controllers/HasilsController');
const pemohonanController = require('../controllers/PemohonanController');
const jadwalPengambilanController = require('../controllers/JadwalPengambilanController');

// Define routes
const routes = [
    // Login route
    { method: 'post', path: '/login', middlewares: [validateLogin, handleValidationErrors], handler: loginController.login },

    // Register route
    { method: 'post', path: '/register', middlewares: [validateUser, handleValidationErrors], handler: userController.register },

    // Aktivasi route
    { method: 'get', path: '/activate/:token', middlewares: [handleValidationErrors], handler: userController.activateAccount },

    // User route
    { method: 'get', path: '/users', middlewares: [verifyToken, checkRole(2)], handler: userController.findUsers },
    {
        method: 'put',
        path: '/users/:id',
        middlewares: [verifyToken, checkRole(2), validateUser, handleValidationErrors],
        handler: userController.updateUser
    },
    {
        method: 'post',
        path: '/users',
        middlewares: [verifyToken, checkRole(2), validateUser, handleValidationErrors],
        handler: userController.createUser
    },
    {
        method: 'put',
        path: '/aktifUsers/:id',
        middlewares: [verifyToken, checkRole(2), handleValidationErrors],
        handler: userController.activateUser
    },
    {
        method: 'get',
        path: '/users/:id',
        middlewares: [verifyToken, checkRole(2)],
        handler: userController.findUserById
    },
    {
        method: 'delete',
        path: '/users/:id',
        middlewares: [verifyToken, checkRole(2)],
        handler: userController.deleteUser
    },

    // Roles route
    {
        method: 'get',
        path: '/roles-all',
        middlewares: [verifyToken, checkRole(2)],
        handler: roleController.findRolesAll
    },

    // Categories route
    { method: 'post', path: '/categories', middlewares: [verifyToken, validateCategory, handleValidationErrors], handler: categoryController.createCategory },
    { method: 'get', path: '/categories', middlewares: [verifyToken], handler: categoryController.findCategories },
    { method: 'get', path: '/categories-all', middlewares: [verifyToken], handler: categoryController.allCategories },
    { method: 'get', path: '/categories/:id', middlewares: [verifyToken], handler: categoryController.findCategoryById },
    { method: 'put', path: '/categories/:id', middlewares: [verifyToken, validateCategory, handleValidationErrors], handler: categoryController.updateCategory },
    { method: 'delete', path: '/categories/:id', middlewares: [verifyToken], handler: categoryController.deleteCategory },

    // Sampel route
    {
        method: 'post',
        path: '/sampels',
        middlewares: [verifyToken, validateSampel, handleValidationErrors],
        handler: sampelController.createSampel
    },
    {
        method: 'get',
        path: '/sampels',
        middlewares: [verifyToken],
        handler: sampelController.findSampels
    },
    {
        method: 'get',
        path: '/sampels/:id',
        middlewares: [verifyToken],
        handler: sampelController.findSampelById
    },
    {
        method: 'put',
        path: '/sampels/:id',
        middlewares: [verifyToken, validateSampel, handleValidationErrors],
        handler: sampelController.updateSampels
    },
    {
        method: 'delete',
        path: '/sampels/:id',
        middlewares: [verifyToken],
        handler: sampelController.deleteSampels
    },
    {
        method: 'get',
        path: '/sampels-by-category/:id',
        middlewares: [verifyToken],
        handler: sampelController.findSampelsByCategoryId
    },

    // route jadwal pengambilan
    { method: 'post', path: '/jadwal-pengambilan', middlewares: [verifyToken, checkRole(2), validateJadwalPengambilan, handleValidationErrors], handler: jadwalPengambilanController.createJadwalPengambilan },
    { method: 'get', path: '/jadwal-pengambilan/:id', middlewares: [verifyToken, checkRole(2)], handler: jadwalPengambilanController.getJadwalPengambilanById },
    { method: 'get', path: '/jadwal-pengambilan', middlewares: [verifyToken, checkRole(2)], handler: jadwalPengambilanController.getAllJadwalPengambilan },

    // route pemohonan (pre-order workflow)
    { method: 'post', path: '/pemohonan', middlewares: [verifyToken, validatePemohonan, handleValidationErrors], handler: pemohonanController.createPemohonan },
    { method: 'get', path: '/pemohonan', middlewares: [verifyToken], handler: pemohonanController.getPemohonanByUserId },
    { method: 'get', path: '/pemohonan/:id', middlewares: [verifyToken], handler: pemohonanController.getPemohonanById },
    { method: 'put', path: '/pemohonan/:id/approve', middlewares: [verifyToken], handler: pemohonanController.approvePemohonan },
    { method: 'put', path: '/pemohonan/:id/cancel', middlewares: [verifyToken], handler: pemohonanController.cancelPemohonan },
    { method: 'post', path: '/pemohonan/cancel-expired', middlewares: [verifyToken, checkRole(2)], handler: pemohonanController.cancelExpiredPemohonan },

    // route order
    { method: 'post', path: '/order', middlewares: [verifyToken, handleValidationErrors], handler: orderController.createOrder },
    {
        method: 'get',
        path: '/sampels-by-user/:id',
        middlewares: [verifyToken],
        handler: orderController.findOrderByUserId
    },
    {
        method: 'delete',
        path: '/carts/:id',
        middlewares: [verifyToken],
        handler: orderController.deleteOrder
    },

    // route transaction
    { method: 'post', path: '/transactions', middlewares: [verifyToken, handleValidationErrors], handler: transactionController.createTransaction },

    {
        method: 'get',
        path: '/transaction-by-user/:id',
        middlewares: [verifyToken],
        handler: transactionController.findTransactionsByUserID
    },

    {
        method: 'get',
        path: '/transaction-by-id/:id',
        middlewares: [verifyToken],
        handler: transactionController.findTransactionByID
    },

    {
        method: 'get',
        path: '/transactions',
        middlewares: [verifyToken, checkRole(2)],
        handler: transactionController.findAllTransactions
    },

    // route hasil
    {
        method: 'get',
        path: '/hasils',
        middlewares: [verifyToken],
        handler: hasilsController.findHasilsAll
    },

    {
        method: 'put',
        path: '/hasils/:id',
        middlewares: [verifyToken, validateHasil, handleValidationErrors],
        handler: hasilsController.hasilsUpdate
    },

];

// Helper function to create routes
const createRoutes = (routes) => {
    routes.forEach(({ method, path, middlewares, handler }) => {
        router[method](path, ...middlewares, handler);
    });
};

// Create routes
createRoutes(routes);

// Export router
module.exports = router;