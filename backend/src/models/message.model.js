import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String, // optional — a message can be image-only
        },
        image: {
            type: String, // stores the Cloudinary URL; optional — a message can be text-only
        },
        status: {
            type: String,
            // three-tier delivery tracking: sent → delivered (recipient online) → read (chat opened)
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },
        isEdited: {
            type: Boolean,
            default: false, // flipped to true when the sender edits the message after it was sent
        },
    },
    { timestamps: true } // createdAt is used as the message timestamp in the UI
);

const Message = mongoose.model("Message", messageSchema);

export default Message;