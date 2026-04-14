import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_SOCKET_URL;

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    // Start as true so the app waits for the auth check before rendering any routes
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });

            // Open the socket connection as soon as we confirm the session is still valid
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },
    
    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");

            // Connect immediately so the user lands on the home page already online
            get().connectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Signup failed. Please try again.");
        } finally {
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");

            // Connect immediately so the user shows as online the moment they log in
            get().connectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed. Please try again.");
        } finally {
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");

            // Close the socket so we stop receiving real-time events after logging out
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed.");
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile.");
        } finally {
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        // Skip if there's no logged in user or a connection is already open
        if(!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        });
        socket.connect();

        set({ socket: socket});

        // Keep the online users list in sync whenever the server broadcasts a change
        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds});
        });
    },

    disconnectSocket: () => {
        // Only attempt to disconnect if a socket is actually connected
        if (get().socket?.connected) get().socket.disconnect();
    },
}));