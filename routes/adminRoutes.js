const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/authMiddleware"); // Destructure functions
const User = require("../models/User");
const DanceMove = require("../models/DanceMove");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

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
router.post("/add-dance", auth, isAdmin, upload.single("image"), async (req, res) => {
    try {
      const { name, category, description } = req.body;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  
      const newMove = new DanceMove({ name, category, description, image: imagePath });
      await newMove.save();
  
      res.status(201).json({ message: "Dance move added successfully!" });
    } catch (error) {
      console.error("Error adding dance move:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// gets the dance moves
router.get("/dancemoves", auth, isAdmin, async (req, res) => {
  try {
    const dances = await DanceMove.find();
    res.json(dances);
  } catch (error) {
    console.error("Failed to fetch dance moves", error);
    res.status(500).json({ error: "Failed to fetch dance moves" });
  }
});

// get dance move by id 
router.get("/dancemoves/:id", auth, isAdmin, async (req, res) => {
  try {
    const dance = await DanceMove.findById(req.params.id);
    if (!dance) {
      return res.status(404).json({ error: "Dance move not found" });
    }
    res.json(dance);
  } catch (error) {
    console.error("Failed to fetch dance move details", error);
    res.status(500).json({ error: "Failed to fetch dance move details" });
  }
});


// update dance move
router.put("/dances/:id", auth, isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const { id } = req.params;

    const updateData = { name, category, description };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedDanceMove = await DanceMove.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedDanceMove) {
      return res.status(404).json({ error: "Dance move not found" });
    }

    res.json({ message: "Dance move updated successfully", updatedDanceMove });
  } catch (error) {
    console.error("Error updating dance move:", error);
    res.status(500).json({ error: "Failed to update dance move" });
  }
});



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