const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        
        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({ message: 'Akses ditolak. Role tidak memenuhi.' });
        }
        next();
    };
};

module.exports = checkRole;