const mongoose = require("mongoose");
const ChallengeSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String },
    creator:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    participants:[{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sequence:    { type: mongoose.Schema.Types.ObjectId, ref: "Sequence" }, // collaborative template
    startedAt:   { type: Date, default: Date.now },
    endsAt:      { type: Date }
});
  
module.exports = mongoose.model("Challenge", ChallengeSchema);
  