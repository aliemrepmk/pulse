import { Server } from "socket.io";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
        methods: ["GET", "POST"], // restrict to only what Socket.io needs
    },
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// Stores online users: { userId: socketId }
const userSocketMap = {};

io.on("connection", (socket) => {
    console.log("A user is connected: " + socket.id);

    const userId = socket.handshake.query.userId;

    // Validate userId is a proper MongoDB ObjectId before storing
    // to prevent map pollution from arbitrary/malformed query params
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        userSocketMap[userId] = socket.id;
        
        // Immediately update any pending \"sent\" messages to \"delivered\" for this user
        (async () => {
            try {
                const undeliveredMessages = await Message.find({ receiverId: userId, status: "sent" });
                if (undeliveredMessages.length > 0) {
                    await Message.updateMany(
                        { receiverId: userId, status: "sent" },
                        { $set: { status: "delivered" } }
                    );

                    // Notify each unique sender
                    const senderIds = [...new Set(undeliveredMessages.map(m => m.senderId.toString()))];
                    senderIds.forEach((senderId) => {
                        const senderSocketId = getReceiverSocketId(senderId);
                        if (senderSocketId) {
                            io.to(senderSocketId).emit("messagesDelivered", { receiverId: userId });
                        }
                    });
                }
            } catch (error) {
                console.log("Error sweeping delivered messages:", error);
            }
        })();
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("typing", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { userId });
        }
    });

    socket.on("stopTyping", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping", { userId });
        }
    });

    socket.on("disconnect", async () => {
        console.log("A user disconnected: " + socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            const lastSeenTime = new Date();
            await User.findByIdAndUpdate(userId, { lastSeen: lastSeenTime });
            io.emit("userWentOffline", { userId, lastSeen: lastSeenTime });
        }
    });
});

export { io, app, server };