const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const User = require("./models/User");
dotenv.config();

const app = express();
app.use(express.json()); // Middleware
app.use(cors());

const connectDB = require("./config/db"); // Import MongoDB connection function
const { auth, isAdmin } = require("./middlewares/authMiddleware");



// Connect to MongoDB Atlas
connectDB()
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch((err) => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1); 
    });



// Authentication Routes 
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);  

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const danceRoutes = require("./routes/danceRoutes");
app.use("/api/dances", danceRoutes);

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.send("Server is running...");
});

app.get("/api/users", auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, "name email role"); // Fetch only necessary fields
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
});

// Serve profile and reset password pages
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/admin", auth, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/reset-password", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "reset-password.html"));
});



// Server Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
