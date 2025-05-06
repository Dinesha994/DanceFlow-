const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  moves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DanceMove' }],
}, 
{ timestamps: true }
);

module.exports = mongoose.model("Sequence", sequenceSchema);
