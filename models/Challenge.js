const challengeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    endsAt: { type: Date, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    userNotes: { type: Map, of: String, default: {} },
  }, { timestamps: true });
  