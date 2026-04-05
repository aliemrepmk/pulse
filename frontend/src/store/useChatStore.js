import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from  "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    typingUsers: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load users.");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load messages.");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message.");
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if(!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        socket.on("newMessage", (newMessage) => {
            if(newMessage.senderId !== selectedUser._id) return;
            set({ 
                messages: [...get().messages, newMessage],
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    subscribeToUserStatus: () => {
        const socket = useAuthStore.getState().socket;
        socket.on("userWentOffline", ({ userId, lastSeen }) => {
            set((state) => ({
                users: state.users.map((user) => 
                    user._id === userId ? { ...user, lastSeen } : user
                ),
                selectedUser: state.selectedUser?._id === userId 
                    ? { ...state.selectedUser, lastSeen } 
                    : state.selectedUser,
            }));
        });
    },

    unsubscribeFromUserStatus: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("userWentOffline");
    },

    subscribeToTypingStatus: () => {
        const socket = useAuthStore.getState().socket;
        socket.on("typing", ({ userId }) => {
            set((state) => ({
                typingUsers: state.typingUsers.includes(userId) 
                    ? state.typingUsers 
                    : [...state.typingUsers, userId],
            }));
        });

        socket.on("stopTyping", ({ userId }) => {
            set((state) => ({
                typingUsers: state.typingUsers.filter((id) => id !== userId),
            }));
        });
    },

    unsubscribeFromTypingStatus: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("typing");
        socket.off("stopTyping");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));