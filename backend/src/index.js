import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;

// Sets secure HTTP headers (X-Frame-Options, X-Content-Type-Options, etc.) on every response
app.use(helmet());

// Cap incoming JSON bodies at 10 MB — large enough for base64 images, small enough to block abuse
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Allow the frontend origin to send cookies on cross-origin requests
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);

// Limit login and signup attempts to slow down brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // max 10 requests per window per IP
    standardHeaders: true,     // return rate-limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
});
// Apply the rate limiter to the two endpoints most likely to be targeted
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
    console.log("Server is running on PORT:" + PORT);
    // Connect to the database after the server is ready, not before —
    // this way the process stays alive even during a brief DB hiccup at startup
    connectDB();
});