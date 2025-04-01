const mongoose = require("mongoose");

const DanceMoveSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Reference to Admin
}, { timestamps: true },
{ collection: 'dancemoves' });

module.exports = mongoose.model("DanceMove", DanceMoveSchema);
