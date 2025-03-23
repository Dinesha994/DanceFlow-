const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/authMiddleware"); // Destructure functions

// Admin Dashboard (Protected)
router.get("/dashboard", auth, isAdmin, (req, res) => {
    res.json({ message: "Welcome to the Admin Dashboard!" });
});

module.exports = router;
