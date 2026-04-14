import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        // Never expose the password hash, even to verified users
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        // jwt.verify throws for expired or tampered tokens — send a clear 401 instead of a generic 500
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
        }
        console.log("Error on protectRoute middleware: " + error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};