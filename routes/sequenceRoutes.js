const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware");
const Sequence = require("../models/Sequence");

// POST /api/sequences
router.post("/", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;

    const newSequence = new Sequence({
      user: userId,
      name,
      description,
    });

    await newSequence.save();
    res.status(201).json({ message: "Sequence created", sequence: newSequence });
  } catch (err) {
    console.error("Sequence creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all sequences for the current user
router.get("/", auth, async (req, res) => {
  try {
    const sequences = await Sequence.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(sequences);
  } catch (error) {
    console.error("Error fetching sequences:", error);
    res.status(500).json({ error: "Failed to fetch sequences" });
  }
});

// UPDATE a sequence
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const updated = await Sequence.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, description },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Sequence not found" });
    res.json(updated);
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ error: "Error updating sequence" });
  }
});

// DELETE a sequence
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Sequence.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deleted) return res.status(404).json({ error: "Sequence not found" });
    res.json({ message: "Sequence deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Error deleting sequence" });
  }
});


module.exports = router;
