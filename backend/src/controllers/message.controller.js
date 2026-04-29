import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Rejects anything that isn't a base64 data URL — prevents SSRF by ensuring we only
// upload user-provided data, never a remote URL we'd be proxying to Cloudinary
const isValidBase64Image = (str) =>
    typeof str === "string" && /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(str);

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        // Exclude the logged-in user from the list so they can't message themselves
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error on getUsersForSidebar: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
            // Never return messages the requesting user has locally deleted
            deletedFor: { $nin: [myId] },
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, replyTo } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // Reject empty messages
        if (!text?.trim() && !image) {
            return res.status(400).json({ error: "Message cannot be empty." });
        }

        let imageUrl;
        if (image) {
            // Prevent SSRF: only accept base64 data URLs, never raw remote URLs
            if (!isValidBase64Image(image)) {
                return res.status(400).json({ error: "Invalid image format." });
            }

            const uploadResponse = await cloudinary.uploader.upload(image, {
                allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
            });
            imageUrl = uploadResponse.secure_url;
        }

        // Build a snapshot of the replied-to message so the preview survives future deletions
        let replyToSnapshot = null;
        if (replyTo?.messageId) {
            const original = await Message.findById(replyTo.messageId);
            if (original) {
                replyToSnapshot = {
                    messageId:  original._id,
                    senderId:   original.senderId,
                    senderName: replyTo.senderName,  // provided by the client from local state
                    text: original.text ? original.text.slice(0, 80) : null,
                    isImage: !!original.image,
                };
            }
        }

        const receiverSocketId = getReceiverSocketId(receiverId);

        // If the recipient is currently online, set status to "delivered" right away;
        // otherwise it stays "sent" and gets upgraded when they next connect
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text?.trim(),
            image: imageUrl,
            status: receiverSocketId ? "delivered" : "sent",
            replyTo: replyToSnapshot,
        });

        await newMessage.save();

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { id: messageId } = req.params;
        const senderId = req.user._id;

        if (!text?.trim()) {
            return res.status(400).json({ error: "Message text cannot be empty." });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Make sure only the original sender can edit their own message
        if (message.senderId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: "Unauthorized to edit this message" });
        }

        message.text = text.trim();
        message.isEdited = true;
        
        await message.save();

        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("updateMessage", message);
        }

        res.status(200).json(message);
    } catch (error) {
        console.log("Error in editMessage controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const receiverId = req.user._id;

        await Message.updateMany(
            { senderId, receiverId, status: { $ne: "read" } },
            { $set: { status: "read" } }
        );

        // Notify the original sender in real time so their checkmarks update without a page refresh
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { senderId, receiverId });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.log("Error in markMessagesAsRead controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Returns the number of unread messages per sender for the logged-in user.
// Shaped as { senderId: count } so the frontend can look up any contact instantly.
export const getUnreadCounts = async (req, res) => {
    try {
        const receiverId = req.user._id;

        const counts = await Message.aggregate([
            { $match: { receiverId, status: { $ne: "read" } } },
            { $group: { _id: "$senderId", count: { $sum: 1 } } },
        ]);

        const result = {};
        counts.forEach(({ _id, count }) => {
            result[_id.toString()] = count;
        });

        res.status(200).json(result);
    } catch (error) {
        console.log("Error in getUnreadCounts controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Hides the message only for the requesting user — the other side is unaffected.
// Available to both the sender and the recipient.
export const deleteMessageForMe = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        // Verify the caller is actually part of this conversation
        const isParticipant =
            message.senderId.toString() === userId.toString() ||
            message.receiverId.toString() === userId.toString();
        if (!isParticipant) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // $addToSet prevents duplicate IDs if the endpoint is somehow called twice
        await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: userId } });

        // No socket event needed — this change only affects the requesting user's view
        res.status(200).json({ success: true });
    } catch (error) {
        console.log("Error in deleteMessageForMe controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Marks the message as deleted for everyone. The document is kept in the database
// so both sides see "This message was deleted" rather than an empty gap.
// Only the original sender can do this.
export const deleteMessageForEveryone = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Unauthorized to delete this message for everyone" });
        }

        message.deletedForEveryone = true;
        await message.save();

        // Tell the recipient to update the bubble on their end immediately
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeletedForEveryone", { messageId });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.log("Error in deleteMessageForEveryone controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};