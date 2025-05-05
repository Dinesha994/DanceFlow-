const mongoose = require("mongoose");
const shareSchema = new mongoose.Schema({
  from:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type:      { type: String, required: true },
  reference: { type: mongoose.Schema.Types.ObjectId, ref: "Sequence", required: true },
  caption:   { type: String },
}, 
{
  timestamps: true
});
module.exports = mongoose.model("Share", shareSchema);
