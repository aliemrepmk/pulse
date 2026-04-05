import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Pencil } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages, setEditingMessage } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    // listen for new messages in real time
    useEffect(() => {
        getMessages(selectedUser._id);
        subscribeToMessages();

        return () => unsubscribeFromMessages();
    }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    // scroll automatically for new messages in real time
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
      
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message._id} className={`chat group ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}>
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
                            {message.isEdited && (
                                <span className="text-[10px] opacity-40 italic mt-0.5">(edited)</span>
                            )}
                            {message.senderId === authUser._id && (
                                <button 
                                    onClick={() => setEditingMessage(message)}
                                    className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity ml-1"
                                    title="Edit message"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>

                        <div className="chat-bubble flex flex-col">
                            {message.image && (
                                <img
                                    src={message.image}
                                    alt="Attachment"
                                    className="sm:max-w-[200px] rounded-md mb-2"
                                />
                            )}
                            {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
                {/* Sentinel element — scroll target for new messages */}
                <div ref={messageEndRef} />
            </div>
            <MessageInput />
        </div>
      );
};

export default ChatContainer;