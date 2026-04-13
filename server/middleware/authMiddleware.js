const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token after "Bearer "

    try {
        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user info to request
        next(); // Move to the next middleware/route handler
        console.log("JWT SECRET (middleware):", process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;