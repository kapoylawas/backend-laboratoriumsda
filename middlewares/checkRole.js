const checkRole = (requiredRole) => {
    return (req, res, next) => {
        // Asumsikan role_id ada di decoded token
        if (req.userRole !== requiredRole) {
            return res.status(403).json({ message: 'Akses ditolak. Role tidak memenuhi.' });
        }
        next();
    };
};

module.exports = checkRole;