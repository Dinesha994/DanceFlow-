const mongoose = require("mongoose");

const ThreadSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Thread", ThreadSchema);
