const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: String,
        email: { type: String, unique: true },
        password: String,
        role: { type: String, enum: ["user", "admin"], default: "user" },
        resetToken: { type: String, default: null }, 
        resetTokenExpiry: { type: Date, default: null }
    },
    { timestamps: true },
    { collection: 'users' }

    
);

module.exports = mongoose.model("User", UserSchema);
