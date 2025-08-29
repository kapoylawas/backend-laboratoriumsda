const express = require('express');

// Init express router
const router = express.Router();

// Import validators and middleware
const { validateLogin, validateUser, validateCategory, validateSampel, validateOrder } = require('../utils/validators');
const { handleValidationErrors, verifyToken, checkRole } = require('../middlewares');

// Import controllers
const loginController = require('../controllers/LoginController');
const userController = require('../controllers/UserController');
const categoryController = require('../controllers/CategoryController');
const sampelController = require('../controllers/SampelController');
const orderController = require('../controllers/OrderController');

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

    // Categories route
    { method: 'post', path: '/categories', middlewares: [verifyToken, checkRole(2), validateCategory, handleValidationErrors], handler: categoryController.createCategory },
    { method: 'get', path: '/categories', middlewares: [verifyToken, checkRole(2),], handler: categoryController.findCategories },
    { method: 'get', path: '/categories-all', middlewares: [verifyToken, checkRole(2),], handler: categoryController.allCategories },
    { method: 'get', path: '/categories/:id', middlewares: [verifyToken, checkRole(2),], handler: categoryController.findCategoryById },
    { method: 'put', path: '/categories/:id', middlewares: [verifyToken, checkRole(2), validateCategory, handleValidationErrors], handler: categoryController.updateCategory },
    { method: 'delete', path: '/categories/:id', middlewares: [verifyToken, checkRole(2),], handler: categoryController.deleteCategory },

    // Sampel route
    {
        method: 'post',
        path: '/sampels',
        middlewares: [verifyToken, checkRole(2), validateSampel, handleValidationErrors],
        handler: sampelController.createSampel
    },
    {
        method: 'get',
        path: '/sampels',
        middlewares: [verifyToken, checkRole(2)],
        handler: sampelController.findSampels
    },
    {
        method: 'get',
        path: '/sampels/:id',
        middlewares: [verifyToken, checkRole(2)],
        handler: sampelController.findSampelById
    },
    {
        method: 'put',
        path: '/sampels/:id',
        middlewares: [verifyToken, checkRole(2), validateSampel, handleValidationErrors],
        handler: sampelController.updateSampels
    },
    {
        method: 'delete',
        path: '/sampels/:id',
        middlewares: [verifyToken, checkRole(2)],
        handler: sampelController.deleteSampels
    },
    {
        method: 'get',
        path: '/sampels-by-category/:id',
        middlewares: [verifyToken, checkRole(2)],
        handler: sampelController.findSampelsByCategoryId
    },

    // route order
    { method: 'post', path: '/order', middlewares: [verifyToken, validateOrder, handleValidationErrors], handler: orderController.createOrder },

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