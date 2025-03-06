const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middlewares/authMiddleware"); 


const router = express.Router();

// User Registration
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user
        user = new User({ name, email, password: hashedPassword, role: "user" });
        await user.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// User Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// gets User data
router.get("/me", auth, async (req, res) => {

    try {
        const user = await User.findById(req.user.userId).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

// profile update
router.put("/update", auth, async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findById(req.user.userId);

        if (name) user.name = name;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();
        res.json({ message: "Profile updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});


module.exports = router;
