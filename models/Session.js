const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sequence: { type: mongoose.Schema.Types.ObjectId, ref: "Sequence", required: true },
  date: { type: Date, required: true },
  time: { type: String }, // Optional: "10:30 AM"
  description: { type: String },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);
