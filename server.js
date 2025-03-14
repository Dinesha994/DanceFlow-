require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const connectDB = require("./config/db"); // Import MongoDB connection function
const { auth, isAdmin } = require("./middlewares/authMiddleware");
const app = express();

// Connect to MongoDB Atlas
connectDB()
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch((err) => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1); 
    });
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

const danceRoutes = require("./routes/danceRoutes");
app.use("/api/dances", danceRoutes);


// Serve `index.html` for all other routes (Frontend will handle routing)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve profile page
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/admin", auth, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Server Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
