
const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/authMiddleware");
const DanceMove = require("../models/DanceMove");

router.post("/add", auth, isAdmin, async (req, res) => {
    try {
        const { name, category, description } = req.body;

        const newMove = new DanceMove({ name, category, description });
        await newMove.save();

        res.status(201).json({ message: "Dance move added successfully", newMove });
    } catch (error) {
        res.status(500).json({ error: "Failed to add dance move" });
    }
});

module.exports = router;
