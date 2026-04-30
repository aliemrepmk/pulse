import { useState } from "react";
import { X, Images } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatLastSeen } from "../lib/utils";
import MediaGallery from "./MediaGallery";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
    const { onlineUsers } = useAuthStore();
    // Controls whether the shared media gallery is visible over the chat
    const [galleryOpen, setGalleryOpen] = useState(false);

    return (
        <>
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

                    <div className="flex items-center gap-1">
                        {/* Opens the shared media gallery for this conversation */}
                        <button
                            onClick={() => setGalleryOpen(true)}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="View shared media"
                        >
                            <Images size={18} />
                        </button>

                        {/* Deselects the current chat and takes the user back to the empty state */}
                        <button onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-sm btn-circle">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Gallery mounts here so it's scoped to the open conversation */}
            {galleryOpen && <MediaGallery onClose={() => setGalleryOpen(false)} />}
        </>
    );
};

export default ChatHeader;