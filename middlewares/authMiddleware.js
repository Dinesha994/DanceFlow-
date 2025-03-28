const jwt = require("jsonwebtoken");
const User = require("../models/User");


// Middleware to check authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    const actualToken = token.split(" ")[1];

    //Decode the token using JWT secret
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    //Use _id from the token (not userId!)
    const user = await User.findById(decoded._id);

    if (!user) {
      console.error("User not found in DB:", decoded._id);
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Admin access only." });
  }
};

module.exports = { auth, isAdmin };