import express from "express";
import { login, logout, signup, updateProfile, checkAuth } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes — rate limiting is applied at the server level for /login and /signup
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes — the caller must have a valid session cookie
router.put("/update-profile", protectRoute, updateProfile);

// Used by the frontend on load to check whether the current session is still valid
router.get("/check", protectRoute, checkAuth);

export default router;