const mongoose = require("mongoose");

const DanceMoveSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      category: { type: String, required: true },
      description: { type: String, required: true },
      image: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Reference to Admin
    }, 

    { timestamps: true },
    { collection: 'dancemoves' }
);

module.exports = mongoose.model("DanceMove", DanceMoveSchema);
