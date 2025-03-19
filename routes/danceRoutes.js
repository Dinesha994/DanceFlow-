const express = require("express");
const router = express.Router();
const DanceMove = require("../models/DanceMove");
const authMiddleware = require("../middlewares/authMiddleware");
const auth = authMiddleware.auth;
const isAdmin = authMiddleware.isAdmin;


// ✅ Admin: Create a New Dance Move
router.post("/add", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { name, description, videoURL, category } = req.body;
        
        if (!name || !category || !description) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const danceMove = new DanceMove({ name, category, description, createdBy: req.user.id });
        await danceMove.save();
        res.status(201).json({ message: "Dance Move Added Successfully", danceMove });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Users: Get All Dance Moves
router.get("/", async (req, res) => {
    try {
        const danceMoves = await DanceMove.find();
        res.status(200).json(danceMoves);
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Admin: Update a Dance Move
router.put("/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const updatedMove = await DanceMove.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMove) return res.status(404).json({ error: "Dance Move Not Found" });

        res.status(200).json({ message: "Dance Move Updated", updatedMove });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Admin: Delete a Dance Move
router.delete("/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const deletedMove = await DanceMove.findByIdAndDelete(req.params.id);
        if (!deletedMove) return res.status(404).json({ error: "Dance Move Not Found" });

        res.status(200).json({ message: "Dance Move Deleted" });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
