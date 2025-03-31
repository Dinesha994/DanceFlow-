const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware");
const Sequence = require("../models/Sequence");

// POST /api/sequences
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, moves } = req.body;
    const userId = req.user._id;

    const newSequence = new Sequence({
      user: userId,
      name,
      description,
      moves,
    });

    await newSequence.save();
    res.status(201).json({ message: "Sequence created", sequence: newSequence });
  } catch (err) {
    console.error("Sequence creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//  GET all sequences for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const sequences = await Sequence.find({ user: req.user._id });
    res.json(sequences);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sequences" });
  }
});

// GET one sequence by ID 
router.get("/:id", auth, async (req, res) => {
  try {
    const sequence = await Sequence.findOne({ _id: req.params.id, user: req.user._id });

    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found or unauthorized" });
    }

    res.json(sequence);
  } catch (err) {
    console.error("Error fetching sequence:", err);
    res.status(500).json({ error: "Failed to fetch sequence" });
  }
});




// UPDATE a sequence
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description, moves } = req.body;
    const updatedSequence = await Sequence.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, description, moves },
      { new: true }
    );
    
    if (!updatedSequence) {
      return res.status(404).json({ error: "Sequence not found or unauthorized" });
    }
    
    res.json({ message: "Sequence updated", sequence: updatedSequence });
    
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a sequence

router.delete("/:id", auth, async (req, res) => {
  try {
    const sequence = await Sequence.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found or unauthorized" });
    }
    res.json({ message: "Sequence deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



module.exports = router;
