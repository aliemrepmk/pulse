import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true, // enforced at the database level to prevent duplicate accounts
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minLength: 6, // also validated in the controller, but the schema acts as a safety net
        },
        profilePic: {
            type: String,
            default: "", // empty string means the frontend falls back to the default avatar
        },
        lastSeen: {
            type: Date,
            default: Date.now, // initialised to creation time so new users don't show as "Long ago"
        },
    },
    { timestamps: true } // adds createdAt and updatedAt automatically
);

const User = mongoose.model("User", userSchema);

export default User;