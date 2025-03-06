const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();

const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Authentication Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);


// Serve `index.html` for all other routes (Frontend will handle routing)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// serve profile page
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "profile.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
