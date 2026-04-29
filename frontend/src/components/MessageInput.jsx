import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { sendMessage, editMessage, selectedUser, editingMessage, setEditingMessage, replyingTo, clearReplyingTo } = useChatStore();
    const { socket, authUser } = useAuthStore();

    // When the user clicks edit on a message, pre-fill the input with its current text
    // and clear any image preview so the editing state is clean
    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.text || "");
            setImagePreview(null);
            // Editing and replying are mutually exclusive — dismiss the reply banner if active
            clearReplyingTo();
        } else {
            setText("");
        }
    }, [editingMessage]);

    const MAX_FILE_SIZE_MB = 5;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        // Bail out before encoding if the image is too large — base64 encoding a huge file
        // can lock up the browser tab and send a payload the server will reject anyway
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.error(`Image must be smaller than ${MAX_FILE_SIZE_MB} MB`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };

        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;

        try {
            if (editingMessage) {
                await editMessage(editingMessage._id, { text: text.trim() });
                setEditingMessage(null);
            } else {
                await sendMessage({
                    text: text.trim(),
                    image: imagePreview,
                });
            }

            // Reset the form back to its empty state
            setText("");
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            // Cancel any pending stopTyping timer and notify the other person right away,
            // so the "Typing..." indicator disappears the moment the message is sent
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (socket && selectedUser) {
                socket.emit("stopTyping", { receiverId: selectedUser._id });
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
        if (socket && selectedUser) {
            // Let the other person know we're typing
            socket.emit("typing", { receiverId: selectedUser._id });

            // Reset the timer each keystroke — stopTyping fires 2 s after the user pauses
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping", { receiverId: selectedUser._id });
            }, 2000);
        }
    };

    return (
        <div className="p-4 w-full relative">
          {/* Banner that appears above the input when the user is replying to a message */}
          {replyingTo && !editingMessage && (
            <div className="absolute -top-12 left-4 right-4 flex items-center justify-between
                            text-xs bg-base-300 px-3 py-1.5 rounded-t-lg
                            border-l-2 border-primary">
                <div className="min-w-0">
                    <span className="font-semibold text-base-content">
                        Replying to {replyingTo.senderId === authUser._id ? "yourself" : selectedUser.fullName}
                    </span>
                    <p className="truncate text-zinc-400">
                        {replyingTo.image && !replyingTo.text ? "📎 Image" : replyingTo.text}
                    </p>
                </div>
                <button type="button" onClick={clearReplyingTo}
                        className="ml-2 shrink-0 text-zinc-400 hover:text-base-content">
                    Cancel
                </button>
            </div>
          )}
          {/* Banner that appears above the input when the user is editing an existing message */}
          {editingMessage && (
            <div className="absolute -top-6 left-4 right-4 flex items-center justify-between text-xs text-zinc-400 bg-base-300 px-3 py-1 rounded-t-lg">
                <span>Editing message...</span>
                <button type="button" onClick={() => setEditingMessage(null)} className="hover:text-base-content">
                    Cancel
                </button>
            </div>
          )}
          {/* Thumbnail preview of the selected image — hidden while editing text */}
          {imagePreview && !editingMessage && (
            <div className="mb-3 flex items-center gap-2">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                  flex items-center justify-center"
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          )}
    
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                placeholder="Type a message..."
                value={text}
                onChange={handleTextChange}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
    
              <button
                type="button"
                className={`hidden sm:flex btn btn-circle
                         ${imagePreview ? "text-emerald-500" : "text-zinc-400"} 
                         ${editingMessage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !editingMessage && fileInputRef.current?.click()}
                disabled={!!editingMessage}
              >
                <Image size={20} />
              </button>
            </div>
            <button
              type="submit"
              className="btn btn-sm btn-circle"
              disabled={!text.trim() && !imagePreview}
            >
              <Send size={22} />
            </button>
          </form>
        </div>
    );
};

export default MessageInput;