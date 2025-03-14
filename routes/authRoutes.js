const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middlewares/authMiddleware"); 


const router = express.Router();

function isStrongPassword(password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[@$!%*?&#]/.test(password);
}

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
        if (!user) {
            console.log("User not found:", email);
            return res.status(400).json({ error: "Invalid credentials" });
        }
        // Validate password
        console.log("Stored Password:", user.password);
        console.log("Entered Password:", password);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Password does NOT match!");
            return res.status(400).json({ error: "Invalid credentials" });
        }
        console.log("Password matches!");

        // Generate JWT token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        
        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// gets User data
router.get("/me", auth, async (req, res) => {

    try {
        const user = await User.findById(req.user._id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

// profile update

router.put("/update", auth, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log("Updating profile for:", req.user._id); // Debug log

        // Find user in DB using `req.user._id`
        let user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update name and email if provided
        if (name) user.name = name;
        if (email) user.email = email;

        // Hash new password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ message: "Profile updated successfully!", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});



module.exports = router;
