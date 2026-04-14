import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected:" + conn.connection.host);
    } catch (error) {
        console.log("MongoDB connection error: " + error);
        // Kill the process so the host environment can restart it rather than leaving
        // a running server that can't talk to the database
        process.exit(1);
    }
};