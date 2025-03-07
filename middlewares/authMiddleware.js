const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to check authentication
const auth = async (req, res, next) => {
    try {
        // Ensure token is provided
        const token = req.header("Authorization");
        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access Denied. No token provided." });
        }

        // Extract token (remove "Bearer " prefix)
        const actualToken = token.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

        // Fetch user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user; // Attach the full user object to `req.user`
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ error: "Admin access only." });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Server error. Unable to verify admin status." });
    }
};


module.exports = { auth, isAdmin };
