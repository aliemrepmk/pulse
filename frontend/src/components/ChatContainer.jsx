import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Pencil, Check, CheckCheck, Trash2, Reply, Pin, PinOff } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages, setEditingMessage, markMessagesAsRead, deleteMessageForMe, deleteMessageForEveryone, setReplyingTo, togglePinMessage } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    // Tracks which message and which delete mode is waiting for confirmation
    const [confirmDelete, setConfirmDelete] = useState(null);
    // Stores a DOM ref for each rendered message bubble, keyed by message._id
    const messageRefsMap = useRef(new Map());

    const scrollToMessage = (messageId) => {
        const el = messageRefsMap.current.get(messageId?.toString());
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // The pinned message for this conversation — at most one will have isPinned: true
    const pinnedMessage = messages.find((m) => m.isPinned);

    // Load the conversation and start listening for new messages whenever the selected user changes
    useEffect(() => {
        getMessages(selectedUser._id);
        subscribeToMessages();

        return () => unsubscribeFromMessages();
    }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    // As long as this chat is open, immediately mark any unread messages from the other person as read
    useEffect(() => {
        if (messages && messages.length > 0) {
            const hasUnread = messages.some(m => m.senderId === selectedUser._id && m.status !== "read");
            if (hasUnread) {
                markMessagesAsRead(selectedUser._id);
            }
        }
    }, [messages, selectedUser._id, markMessagesAsRead]);

    // Scroll to the bottom every time a new message arrives so the user always sees the latest one
    useEffect(() => {
        if(messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth"});
        }
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            {/* Pinned message banner — derived from messages array, no extra fetch */}
            {pinnedMessage && (
                <div
                    onClick={() => scrollToMessage(pinnedMessage._id)}
                    className="flex items-center gap-2 px-4 py-2 border-b border-base-300
                               bg-base-200 cursor-pointer hover:bg-base-300 transition-colors shrink-0"
                >
                    <Pin size={13} className="shrink-0 text-base-content/50" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wide leading-none mb-0.5">
                            Pinned Message
                        </p>
                        <p className="text-sm truncate">
                            {pinnedMessage.image && !pinnedMessage.text
                                ? "📎 Image"
                                : pinnedMessage.text}
                        </p>
                    </div>
                </div>
            )}
      
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message._id}
                        ref={(el) => el
                            ? messageRefsMap.current.set(message._id.toString(), el)
                            : messageRefsMap.current.delete(message._id.toString())
                        }
                        className={`chat group ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                    >
                        <div className=" chat-image avatar">
                            <div className="size-10 rounded-full border">
                                <img
                                    src={
                                      message.senderId === authUser._id
                                        ? authUser.profilePic || "/avatar.png"
                                        : selectedUser.profilePic || "/avatar.png"
                                    }
                                    alt="profile pic"
                                />
                            </div>
                        </div>

                        <div className="chat-header mb-1 flex items-center gap-1">
                            <time className="text-xs opacity-50 ml-1">
                                {formatMessageTime(message.createdAt)}
                            </time>
                            {message.isEdited && !message.deletedForEveryone && (
                                <span className="text-[10px] opacity-40 italic mt-0.5">(edited)</span>
                            )}
                            {/* Green double-check = read, grey double-check = delivered, single-check = sent */}
                            {message.senderId === authUser._id && (
                                <span className="ml-1 mt-0.5" title={message.status}>
                                    {message.status === "read" ? (
                                        <CheckCheck size={14} className="text-emerald-500" />
                                    ) : message.status === "delivered" ? (
                                        <CheckCheck size={14} className="text-zinc-400" />
                                    ) : (
                                        <Check size={14} className="text-zinc-400" />
                                    )}
                                </span>
                            )}

                            {/* Action buttons — hidden until hover, suppressed on already-deleted messages */}
                            {!message.deletedForEveryone && (
                                <>
                                    {confirmDelete?.id === message._id ? (
                                        // Inline confirmation — shown for both delete modes
                                        <span className="flex items-center gap-1 ml-1 text-[11px] opacity-80">
                                            <span>
                                                {confirmDelete.type === 'everyone'
                                                    ? 'Delete for everyone?'
                                                    : 'Delete for you?'}
                                            </span>
                                            <button
                                                onClick={async () => {
                                                    const { id, type } = confirmDelete;
                                                    setConfirmDelete(null);
                                                    if (type === 'everyone') {
                                                        await deleteMessageForEveryone(id);
                                                    } else {
                                                        await deleteMessageForMe(id);
                                                    }
                                                }}
                                                className="text-red-500 font-semibold hover:underline"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="opacity-60 hover:opacity-100"
                                            >
                                                No
                                            </button>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                            {/* Reply — available to both sender and recipient */}
                                            <button
                                                onClick={() => setReplyingTo({
                                                    ...message,
                                                    senderName: message.senderId === authUser._id
                                                        ? authUser.fullName
                                                        : selectedUser.fullName,
                                                })}
                                                className="opacity-50 hover:opacity-100 transition-opacity"
                                                title="Reply"
                                            >
                                                <Reply size={12} />
                                            </button>
                                            {/* Pin / Unpin — available to both participants */}
                                            <button
                                                onClick={() => togglePinMessage(message._id)}
                                                className="opacity-50 hover:opacity-100 transition-opacity"
                                                title={message.isPinned ? "Unpin message" : "Pin message"}
                                            >
                                                {message.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                                            </button>
                                            {/* Edit — only for own text messages */}
                                            {message.senderId === authUser._id && message.text && (
                                                <button
                                                    onClick={() => setEditingMessage(message)}
                                                    className="opacity-50 hover:opacity-100 transition-opacity"
                                                    title="Edit message"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            )}
                                            {/* Delete for me — available to both sender and recipient */}
                                            <button
                                                onClick={() => setConfirmDelete({ id: message._id, type: 'me' })}
                                                className="opacity-50 hover:opacity-100 transition-opacity"
                                                title="Delete for me"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                            {/* Delete for everyone — sender only, triggers inline confirmation */}
                                            {message.senderId === authUser._id && (
                                                <button
                                                    onClick={() => setConfirmDelete({ id: message._id, type: 'everyone' })}
                                                    className="opacity-50 hover:!opacity-100 transition-opacity text-red-500"
                                                    title="Delete for everyone"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="chat-bubble flex flex-col">
                            {message.deletedForEveryone ? (
                                // WhatsApp-style placeholder shown to both sides after delete-for-everyone
                                <p className="italic opacity-50 text-sm">This message was deleted</p>
                            ) : (
                                <>
                                    {/* Quote preview of the replied-to message — clicking scrolls to the original */}
                                    {message.replyTo?.messageId && (
                                        <div
                                            onClick={() => scrollToMessage(message.replyTo.messageId)}
                                            className="cursor-pointer mb-2 px-2 py-1 rounded
                                                       bg-black/10 border-l-2 border-base-content/40
                                                       text-xs opacity-75 hover:opacity-100 transition-opacity"
                                        >
                                            <p className="font-semibold truncate">{message.replyTo.senderName}</p>
                                            <p className="truncate">
                                                {message.replyTo.isImage && !message.replyTo.text
                                                    ? "📎 Image"
                                                    : message.replyTo.text ?? ""}
                                            </p>
                                        </div>
                                    )}
                                    {message.image && (
                                        <img
                                            src={message.image}
                                            alt="Attachment"
                                            className="sm:max-w-[200px] rounded-md mb-2"
                                        />
                                    )}
                                    {message.text && <p>{message.text}</p>}
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {/* Empty div at the bottom so we can scroll here when a new message arrives */}
                <div ref={messageEndRef} />
            </div>
            <MessageInput />
        </div>
      );
};

export default ChatContainer;