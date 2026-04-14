import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatLastSeen } from "../lib/utils";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
    const { onlineUsers } = useAuthStore();

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Profile picture — falls back to the default avatar if none is set */}
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                        </div>
                    </div>

                    {/* Name and current status line */}
                    <div>
                        <h3 className="font-medium">{selectedUser.fullName}</h3>
                        {/* Priority order: typing indicator > online > last-seen timestamp */}
                        <p className="text-sm text-base-content/70">
                            {typingUsers.includes(selectedUser._id) ? (
                                <span className="animate-pulse text-emerald-500 font-medium">Typing...</span>
                            ) : onlineUsers.includes(selectedUser._id) ? (
                                "Online"
                            ) : (
                                selectedUser.lastSeen ? `Last seen ${formatLastSeen(selectedUser.lastSeen).toLowerCase()}` : "Offline"
                            )}
                        </p>
                    </div>
                </div>

                {/* Deselects the current chat and takes the user back to the empty state */}
                <button onClick={() => setSelectedUser(null)}>
                    <X />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;