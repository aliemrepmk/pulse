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
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: " + error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
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

        const receiverSocketId = getReceiverSocketId(receiverId);

        // If the recipient is currently online, set status to "delivered" right away;
        // otherwise it stays "sent" and gets upgraded when they next connect
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text?.trim(),
            image: imageUrl,
            status: receiverSocketId ? "delivered" : "sent",
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