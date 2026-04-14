import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// Rejects anything that isn't a base64 data URL for an image — prevents SSRF by ensuring
// we only ever upload user-provided data, never a remote URL we'd be proxying
const isValidBase64Image = (str) =>
    typeof str === "string" && /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(str);

export const signup = async (req, res) => {
    // Normalise the email so "User@Mail.com" and "user@mail.com" are treated as the same account
    const { fullName, email: rawEmail, password } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters!" });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "Email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            // Issue the token before saving so the user is logged in the moment the account is created
            generateToken(newUser.id, res);
            await newUser.save();

            // Only return safe fields — never include the hashed password in a response
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller: " + error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    // Normalise the email on login to match however it was stored at signup
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        generateToken(user._id, res);

        // Only return safe fields — never include the hashed password in a response
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log("Error in login controller: " + error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = (req, res) => {
    try {
        // Overwrite the cookie with an empty value and a zero maxAge to force the browser to delete it
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller: " + error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { profilePic } = req.body;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        // Never accept a raw remote URL here — that would let attackers proxy requests through our server
        if (!isValidBase64Image(profilePic)) {
            return res.status(400).json({ message: "Invalid image format. Please upload a valid image." });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error on updating the profile: " + error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth route: " + error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};