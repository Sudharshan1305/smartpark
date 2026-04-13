// This middleware checks if the logged-in user has the "admin" role
const roleMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, allow access
    } else {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
};

module.exports = roleMiddleware;