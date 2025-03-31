const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middlewares/authMiddleware"); 
const nodemailer = require("nodemailer");


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

function isStrongPassword(password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[@$!%*?&#]/.test(password);
}

// User Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        console.log("Login success for:", user.email, "| role:", user.role);
        console.log("Generated Token:", token);

        res.json({ message: "Login successful", token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});


// gets User data
router.get("/me", auth, async (req, res) => {
    console.log("/me called with user:", req.user);
    try {
      const user = await User.findById(req.user._id).select("-password");
      res.json(user);
    } catch (error) {
      console.error("Error in /me:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });
  

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Generate password reset token
        const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // DEBUG LOGGING 
        console.log("Generated Reset Token:", resetToken);

        // Store token & expiry in DB using MongoDB update
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                resetToken: resetToken,
                resetTokenExpiry: Date.now() + 3600000, // 1 hour expiry
            },
            { new: true } // Ensure we get updated user
        );

        // DEBUGGING - Check if the update was successful
        if (!updatedUser.resetToken) {
            console.error("ERROR: Token not saved in MongoDB!");
            return res.status(500).json({ error: "Failed to save reset token." });
        }

        console.log("Updated User in DB:", updatedUser);

        // Send email
        const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Request",
            html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
        });

        res.json({ message: "Password reset email sent!" });

    } catch (error) {
        console.error("Error in forgot-password route:", error);
        res.status(500).json({ error: "Server error. Try again later." });
    }
});



router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find user with matching reset token and valid expiry
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() } // Ensure token is not expired
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token." });
        }

        // Hash new password and update user
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined; // Remove token after successful reset
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: "Password reset successful!" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: "Server error. Try again later." });
    }
});





const transporter = nodemailer.createTransport({
    service: "gmail", // Change to your email provider (Gmail, Outlook, etc.)
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email app password
    },
});




// profile update

router.put("/update-profile", auth, async (req, res) => {
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