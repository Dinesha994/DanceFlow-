const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Only Admins can access this route
router.get("/admin-dashboard", authMiddleware, roleMiddleware("admin"), (req, res) => {
    res.json({ message: "Welcome, Admin!" });
});

// Normal users can access this route
router.get("/user-dashboard", authMiddleware, (req, res) => {
    res.json({ message: "Welcome, User!" });
});

module.exports = router;
