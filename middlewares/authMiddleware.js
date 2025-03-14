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
        console.log("Decoded Token:", decoded);
        const user = await User.findById(decoded._id);

        if (!user) {
            console.error("User not found in DB:", decoded._id); 
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user; // Attach the full user object to `req.user`
        next();
    } catch (error) {
        console.error("Authentication Error:", error.message);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
    try {
        // Use `req.user` directly (fetched in `auth`)
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access only." });
        }
        next();
    } catch (error) {
        return res.status(500).json({ error: "Server error. Unable to verify admin status." });
    }
};

module.exports = { auth, isAdmin };
