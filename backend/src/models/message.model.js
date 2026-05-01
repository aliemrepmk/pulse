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
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                // each ID here means this message is completely hidden for that user
            }
        ],
        deletedForEveryone: {
            type: Boolean,
            default: false, // true = bubble stays but shows "This message was deleted" on both sides
        },
        replyTo: {
            messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
            senderId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            // Snapshot fields so the preview still renders even if the original is later deleted
            senderName: { type: String },
            text: { type: String },          // first 80 chars of original text; null if image-only
            isImage: { type: Boolean, default: false }, // true if the original message had an image
        },
        isPinned: {
            type: Boolean,
            default: false, // at most one message per conversation has this set to true
        },
    },
    { timestamps: true } // createdAt is used as the message timestamp in the UI
);

const Message = mongoose.model("Message", messageSchema);

export default Message;