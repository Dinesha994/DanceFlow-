const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware");
const Session = require("../models/Session");

// Create a session
router.post("/", auth, async (req, res) => {
  try {
    const { sequence, date, time, description } = req.body;

    const session = new Session({
      user: req.user._id,
      sequence,
      date,
      time,
      description,
    });

    await session.save();
    res.status(201).json({ message: "Session created", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get all sessions for user
router.get("/", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).populate("sequence");
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Update session (mark as complete / edit details)
router.put("/:id", auth, async (req, res) => {
  try {
    const { date, time, description, completed } = req.body;
    const updated = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { date, time, description, completed },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Session not found" });

    res.json({ message: "Session updated", session: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// Delete a session
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Session.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ error: "Session not found" });

    res.json({ message: "Session deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
