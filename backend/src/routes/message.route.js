import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar, getMessages, sendMessage, editMessage, markMessagesAsRead, getUnreadCounts, deleteMessageForMe, deleteMessageForEveryone } from "../controllers/message.controller.js";

const router = express.Router();

// Read endpoints
router.get("/users", protectRoute, getUsersForSidebar);   // everyone except the logged-in user
// Must come before /:id so Express doesn't treat "unread-counts" as a user ID param
router.get("/unread-counts", protectRoute, getUnreadCounts);
router.get("/:id", protectRoute, getMessages);            // full conversation with a specific user

// Write endpoints
router.post("/send/:id", protectRoute, sendMessage);
router.put("/edit/:id", protectRoute, editMessage);
router.put("/mark-read/:senderId", protectRoute, markMessagesAsRead); // called when the recipient opens the chat
router.delete("/delete-for-me/:id", protectRoute, deleteMessageForMe);
router.delete("/delete-for-everyone/:id", protectRoute, deleteMessageForEveryone);

export default router;