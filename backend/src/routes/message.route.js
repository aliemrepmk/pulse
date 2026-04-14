import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar, getMessages, sendMessage, editMessage, markMessagesAsRead } from "../controllers/message.controller.js";

const router = express.Router();

// Read endpoints
router.get("/users", protectRoute, getUsersForSidebar);   // everyone except the logged-in user
router.get("/:id", protectRoute, getMessages);            // full conversation with a specific user

// Write endpoints
router.post("/send/:id", protectRoute, sendMessage);
router.put("/edit/:id", protectRoute, editMessage);
router.put("/mark-read/:senderId", protectRoute, markMessagesAsRead); // called when the recipient opens the chat

export default router;