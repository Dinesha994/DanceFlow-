const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const User = require("./models/User");
const DanceMove = require('./models/DanceMove');
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

const sequenceRoutes = require("./routes/sequenceRoutes");
app.use("/api/sequences", sequenceRoutes);


// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.send("Server is running...");
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, "name email role"); // Fetch only necessary fields
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
});

app.get('/api/dances', async (req, res) => {
    try {
      const moves = await DanceMove.find();
      res.json(moves);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch dance moves" });
    }
  });

// Serve profile and reset password pages
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "profile.html"));
});

// Serve User Login Page
app.get("/user-login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "user-login.html"));
});

// Serve Admin Login Page
app.get("/admin-login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin-login.html"));
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
