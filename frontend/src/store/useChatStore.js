import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from  "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    typingUsers: [],
    selectedUser: null,
    editingMessage: null,
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

    // Fetch the full conversation history for a given user
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

    editMessage: async (messageId, messageData) => {
        try {
            const res = await axiosInstance.put(`/messages/edit/${messageId}`, messageData);
            set((state) => ({
                messages: state.messages.map((m) => m._id === messageId ? res.data : m),
                editingMessage: null,
            }));
            toast.success("Message edited successfully");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to edit message.");
        }
    },

    // Flip every sent/delivered message from this sender to "read" and update local state
    markMessagesAsRead: async (senderId) => {
        try {
            await axiosInstance.put(`/messages/mark-read/${senderId}`);
            set((state) => ({
                messages: state.messages.map((m) => 
                    (m.senderId === senderId && m.status !== "read") ? { ...m, status: "read" } : m
                ),
            }));
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    },

    // Start listening for real-time message events for the currently open conversation.
    // Must only be called after selectedUser is set, otherwise we'd process every
    // incoming message regardless of who sent it.
    subscribeToMessages: () => {
        const { selectedUser } = get();
        if(!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        // Only add to the list if the message is from the person we're currently chatting with
        socket.on("newMessage", (newMessage) => {
            if(newMessage.senderId !== selectedUser._id) return;
            set({ 
                messages: [...get().messages, newMessage],
            });
        });

        // Handle in-place edits — update the matching message bubble without re-fetching
        socket.on("updateMessage", (updatedMessage) => {
            if(updatedMessage.senderId !== selectedUser._id && updatedMessage.receiverId !== selectedUser._id) return;
            set({
                messages: get().messages.map((m) => m._id === updatedMessage._id ? updatedMessage : m),
            });
        });

        // The other person opened our conversation — flip our sent messages to "read"
        socket.on("messagesRead", ({ senderId, receiverId }) => {
            set((state) => ({
                messages: state.messages.map((m) => 
                    (m.senderId === useAuthStore.getState().authUser?._id && m.receiverId === receiverId && m.status !== "read") 
                        ? { ...m, status: "read" } 
                        : m
                ),
            }));
        });

        // The other person came online and picked up our messages — upgrade "sent" to "delivered"
        socket.on("messagesDelivered", ({ receiverId }) => {
            set((state) => ({
                messages: state.messages.map((m) => 
                    // If we sent it and it hasn't been read yet, mark it as delivered
                    (m.senderId === useAuthStore.getState().authUser?._id && m.receiverId === receiverId && m.status === "sent")
                        ? { ...m, status: "delivered" }
                        : m
                ),
            }));
        });
    },

    // Tear down all message listeners when leaving the current conversation
    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("updateMessage");
        socket.off("messagesRead");
        socket.off("messagesDelivered");
    },

    // Keep the contact list up to date when someone goes offline
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

    // Track which users are currently typing so the "Typing..." indicator can appear
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

    setEditingMessage: (message) => set({ editingMessage: message }),
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));