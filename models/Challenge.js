const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    endsAt: { type: Date, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, content: String, createdAt: { type: Date, default: Date.now }}]
  },
   { timestamps: true });

module.exports = mongoose.model("Challenge", ChallengeSchema);

  