const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const User = require("./models/User");
const DanceMove = require('./models/DanceMove');
dotenv.config();

// setup express app
const app = express();
app.use(express.json()); // reads req
app.use(cors()); 

const { auth, isAdmin } = require("./middlewares/authMiddleware");

const connectDB = require("./config/db"); 

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

const sessionRoutes = require("./routes/sessionRoutes");
app.use("/api/sessions", sessionRoutes);

const communityRoutes = require("./routes/communityRoutes");
app.use("/api/community", communityRoutes);


// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, "public")));

app.use('/uploads', express.static('uploads'));

app.use('/fullcalendar', express.static(path.join(__dirname, 'node_modules', '@fullcalendar', 'core')));
app.use('/fullcalendar-daygrid', express.static(path.join(__dirname, 'node_modules', '@fullcalendar', 'daygrid')));
app.use('/fullcalendar-timegrid', express.static(path.join(__dirname, 'node_modules', '@fullcalendar', 'timegrid')));
app.use('/fullcalendar-interaction', express.static(path.join(__dirname, 'node_modules', '@fullcalendar', 'interaction')));


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

// Server Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
