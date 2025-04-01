const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/authMiddleware"); // Destructure functions
const User = require("../models/User");
const DanceMove = require("../models/DanceMove");

// Admin Dashboard (Protected)
router.get("/dashboard", auth, isAdmin, (req, res) => {
    res.json({ message: "Welcome to the Admin Dashboard!" });
});

// Route to get all users (with keyword search)
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
      const search = req.query.search || "";
      const regex = new RegExp(search, "i");
  
      const users = await User.find({
        $or: [
          { name: regex },
          { email: regex },
          { role: regex }
        ]
      }).select("name email role");
  
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  


// POST: Add Dance Move (Admin only)
router.post("/add-dance", auth, isAdmin, async (req, res) => {
    try {
      const { name, category, description } = req.body;
  
      const newMove = new DanceMove({ name, category, description });
      await newMove.save();
  
      res.status(201).json({ message: "Dance move added successfully!" });
    } catch (error) {
      console.error("Error adding dance move:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/dancemoves", auth, isAdmin, async (req, res) => {
    try {
        console.log("Fetching dance moves...");
        const dances = await DanceMove.find(); // Get all dance moves
        res.json(dances); // Send them back as a JSON response
    } catch (error) {
        console.error("Failed to fetch dance moves", error);
        res.status(500).json({ error: "Failed to fetch dance moves" });
    }
});

// adminRoutes.js
router.put("/dances/:id", auth, isAdmin, async (req, res) => {
  try {
      const { name, category, description } = req.body;
      const { id } = req.params;

      // Find the dance move by its ID and update it
      const updatedDanceMove = await DanceMove.findByIdAndUpdate(id, {
          name,
          category,
          description
      }, { new: true }); // 'new' ensures the updated document is returned

      if (!updatedDanceMove) {
          return res.status(404).json({ error: "Dance move not found" });
      }

      res.json({ message: "Dance move updated successfully", updatedDanceMove });
  } catch (error) {
      console.error("Error updating dance move:", error);
      res.status(500).json({ error: "Failed to update dance move" });
  }
});

// adminRoutes.js
router.delete("/dances/:id", auth, isAdmin, async (req, res) => {
  try {
      const { id } = req.params;

      const deletedDanceMove = await DanceMove.findByIdAndDelete(id);

      if (!deletedDanceMove) {
          return res.status(404).json({ error: "Dance move not found" });
      }

      res.json({ message: "Dance move deleted successfully" });
  } catch (error) {
      console.error("Error deleting dance move:", error);
      res.status(500).json({ error: "Failed to delete dance move" });
  }
});

module.exports = router;