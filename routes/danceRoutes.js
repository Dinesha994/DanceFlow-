const express = require("express");
const { auth, isAdmin } = require("../middlewares/authMiddleware");
const DanceMove = require("../models/DanceMove");

const router = express.Router();

// Admin: Create a New Dance Move
router.post("/add", auth, isAdmin, async (req, res) => {
    try {
        const { name, description, category } = req.body;
        
        if (!name || !category || !description) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const danceMove = new DanceMove({
            name,
            category,
            description,
            createdBy: req.user._id // Fixed `createdBy` reference
        });

        await danceMove.save();
        res.status(201).json({ message: "Dance Move Added Successfully", danceMove });
    } catch (error) {
        console.error("Error creating dance move:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Users: Get All Dance Moves
router.get("/", async (req, res) => {
    try {
        const danceMoves = await DanceMove.find();
        res.status(200).json(danceMoves);
    } catch (error) {
        console.error("Error fetching dance moves:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Admin: Update a Dance Move
router.put("/:id", auth, isAdmin, async (req, res) => {
    try {
        const { name, category, description } = req.body;

        const updatedMove = await DanceMove.findByIdAndUpdate(
            req.params.id,
            { name, category, description },
            { new: true }
        );

        if (!updatedMove) {
            return res.status(404).json({ error: "Dance Move Not Found" });
        }

        res.status(200).json({ message: "Dance Move Updated", updatedMove });
    } catch (error) {
        console.error("Error updating dance move:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Admin: Delete a Dance Move
router.delete("/:id", auth, isAdmin, async (req, res) => {
    try {
        const deletedMove = await DanceMove.findByIdAndDelete(req.params.id);

        if (!deletedMove) {
            return res.status(404).json({ error: "Dance Move Not Found" });
        }

        res.status(200).json({ message: "Dance Move Deleted" });
    } catch (error) {
        console.error("Error deleting dance move:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
