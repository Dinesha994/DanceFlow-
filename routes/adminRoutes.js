const express = require("express");
const { auth, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/admin", auth, isAdmin, (req, res) => {
    res.json({ message: "Welcome, Admin!" });
});

module.exports = router;
