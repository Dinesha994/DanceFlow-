const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  thread:    { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true },
  author:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Post", PostSchema);
