const express = require('express');

// Init express router
const router = express.Router();

// Import validators and middleware
const { validateLogin, validateUser, validateCategory } = require('../utils/validators');
const { handleValidationErrors, verifyToken } = require('../middlewares');

// Import controllers
const loginController = require('../controllers/LoginController');
const userController = require('../controllers/UserController');
const categoryController = require('../controllers/CategoryController');

// Define routes
const routes = [
    // Login route
    { method: 'post', path: '/login', middlewares: [validateLogin, handleValidationErrors], handler: loginController.login },

    // Register route
    { method: 'post', path: '/register', middlewares: [validateUser, handleValidationErrors], handler: userController.register },

    // Aktivasi route
    { method: 'get', path: '/activate/:token', middlewares: [handleValidationErrors], handler: userController.activateAccount },

    // User route
    { method: 'get', path: '/users', middlewares: [verifyToken], handler: userController.findUsers },

    // Categoru route
    { method: 'get', path: '/categories', middlewares: [verifyToken], handler: categoryController.findCategories },
    { method: 'post', path: '/categories', middlewares: [verifyToken, validateCategory, handleValidationErrors], handler: categoryController.createCategory }
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