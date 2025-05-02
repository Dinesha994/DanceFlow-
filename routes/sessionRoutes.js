const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware");
const Session = require("../models/Session");

// Fetch today's sessions
router.get("/today", auth, async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sessions = await Session.find({
    user: userId,
    date: { $gte: today, $lt: tomorrow },
    completed: false
  }).populate("sequence");

  res.json(sessions);
});


// Create a session
router.post("/", auth, async (req, res) => {
  try {
    const { sequence, date, description } = req.body;

    const session = new Session({
      user: req.user._id,
      sequence,
      date,
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
    const { date, description, completed } = req.body;
    const updated = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, 
      { date, description, completed },
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
