import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { showNotification } from "../lib/notifications";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    typingUsers: [],
    selectedUser: null,
    editingMessage: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    // Tracks how many unread messages each contact has sent while their chat wasn't open
    unreadCounts: {},

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
                // Clear the badge now that the user has read everything from this sender
                unreadCounts: { ...state.unreadCounts, [senderId]: 0 },
            }));
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    },

    // Remove the message from the local list immediately, then tell the server
    deleteMessageForMe: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/delete-for-me/${messageId}`);
            set((state) => ({
                messages: state.messages.filter((m) => m._id !== messageId),
            }));
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete message.");
        }
    },

    // Flip the local bubble to "deleted" immediately, then persist on the server
    deleteMessageForEveryone: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/delete-for-everyone/${messageId}`);
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, deletedForEveryone: true } : m
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete message.");
        }
    },

    // Fetches the initial unread count per sender so badges are accurate on first load
    getUnreadCounts: async () => {
        try {
            const res = await axiosInstance.get("/messages/unread-counts");
            set({ unreadCounts: res.data });
        } catch (error) {
            console.error("Failed to fetch unread counts:", error);
        }
    },

    // Always-on handler for incoming messages — active for the entire session.
    // Routes each message to either the open conversation or the unread counter,
    // depending on whether its sender is the currently selected user.
    subscribeToGlobalMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.on("newMessage", (newMessage) => {
            const { selectedUser } = get();
            if (selectedUser?._id === newMessage.senderId) {
                // The chat with this person is open — add the message to the visible list
                set({ messages: [...get().messages, newMessage] });
            } else {
                // Different conversation — bump the badge counter for that contact
                set((state) => ({
                    unreadCounts: {
                        ...state.unreadCounts,
                        [newMessage.senderId]: (state.unreadCounts[newMessage.senderId] || 0) + 1,
                    },
                }));
            }

            // Notify whenever the tab is hidden — regardless of which chat is open,
            // the user can't see arriving messages if they've switched away from the tab
            if (document.hidden) {
                const sender = get().users.find((u) => u._id === newMessage.senderId);

                const title = sender?.fullName ?? "New message";

                const body = newMessage.deletedForEveryone
                    ? "This message was deleted"
                    : newMessage.text
                        ? newMessage.text.length > 60
                            ? newMessage.text.slice(0, 60) + "…"
                            : newMessage.text
                        : "Sent an image";

                const icon = sender?.profilePic || "/avatar.png";

                // Clicking the notification selects that user's conversation
                showNotification(title, body, icon, () => {
                    if (sender) get().setSelectedUser(sender);
                });
            }
        });
    },


    unsubscribeFromGlobalMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    // Start listening for conversation-specific events for the currently open chat.
    // newMessage is intentionally excluded — it's handled globally by subscribeToGlobalMessages.
    // Must only be called after selectedUser is set.
    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        // Handle in-place edits — update the matching message bubble without re-fetching
        socket.on("updateMessage", (updatedMessage) => {
            if (updatedMessage.senderId !== selectedUser._id && updatedMessage.receiverId !== selectedUser._id) return;
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

        // The sender deleted this message for everyone — flip our bubble to "deleted" state
        socket.on("messageDeletedForEveryone", ({ messageId }) => {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, deletedForEveryone: true } : m
                ),
            }));
        });
    },

    // Tear down conversation-specific listeners when leaving the current chat
    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        // Note: newMessage is intentionally omitted — the global listener manages it
        socket.off("updateMessage");
        socket.off("messagesRead");
        socket.off("messagesDelivered");
        socket.off("messageDeletedForEveryone");
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

    // Clear the unread badge immediately when the user taps a contact
    // so the counter disappears before markMessagesAsRead even finishes
    setSelectedUser: (selectedUser) => set((state) => ({
        selectedUser,
        unreadCounts: selectedUser
            ? { ...state.unreadCounts, [selectedUser._id]: 0 }
            : state.unreadCounts,
    })),
}));