import jwt from "jsonwebtoken";

// Creates a signed JWT and sets it as an httpOnly cookie on the response.
// The token and cookie both expire after 7 days — they must stay in sync
// or a valid token could be sent in a cookie the browser has already discarded.
export const generateToken = (userId, res) => {

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
        // Pin the algorithm explicitly so an attacker can't swap in "none" or a weaker variant
        algorithm: "HS256",
    });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,   // keeps the cookie out of reach of client-side JS (XSS protection)
        sameSite: "strict", // blocks the cookie from being sent in cross-site requests (CSRF protection)
        secure: process.env.NODE_ENV !== "development", // HTTPS only in production
    });

    return token;
};