import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const MediaGallery = ({ onClose }) => {
    const { messages, selectedUser } = useChatStore();
    const [lightboxIndex, setLightboxIndex] = useState(null);

    // Collect every image from this conversation, excluding deleted messages, newest first
    const mediaMessages = messages
        .filter((m) => m.image && !m.deletedForEveryone)
        .reverse();

    // Arrow keys navigate the lightbox, Escape closes it
    useEffect(() => {
        const handler = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === "ArrowLeft")  setLightboxIndex((i) => Math.max(0, i - 1));
            if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(mediaMessages.length - 1, i + 1));
            if (e.key === "Escape")     setLightboxIndex(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxIndex, mediaMessages.length]);

    return (
        <>
            {/* Gallery panel — slides over the chat area */}
            <div className="fixed inset-0 z-40 bg-base-100 flex flex-col">

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
                    <div>
                        <h2 className="font-semibold">Shared Media</h2>
                        <p className="text-xs text-base-content/60">
                            {mediaMessages.length} {mediaMessages.length === 1 ? "image" : "images"} with {selectedUser.fullName}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable image grid */}
                <div className="flex-1 overflow-y-auto p-2">
                    {mediaMessages.length === 0 ? (
                        // Empty state — no images have been shared in this conversation yet
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-base-content/40">
                            <Images size={48} />
                            <p className="text-sm">No media shared yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1">
                            {mediaMessages.map((m, idx) => (
                                <div
                                    key={m._id}
                                    onClick={() => setLightboxIndex(idx)}
                                    className="relative aspect-square cursor-pointer group overflow-hidden rounded"
                                >
                                    <img
                                        src={m.image}
                                        alt="Shared media"
                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                    {/* Timestamp shown on hover so the grid stays clean by default */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                        <span className="text-white text-[10px]">
                                            {formatMessageTime(m.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox — sits on top of the gallery panel */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-4 right-4 btn btn-ghost btn-circle text-white hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>

                    {/* Position counter so the user knows where they are in the sequence */}
                    <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm select-none">
                        {lightboxIndex + 1} / {mediaMessages.length}
                    </span>

                    {/* Full-size image — clicks on it don't propagate to the backdrop */}
                    <img
                        src={mediaMessages[lightboxIndex].image}
                        alt="Full size"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Previous — hidden on the first image */}
                    {lightboxIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i - 1); }}
                            className="absolute left-4 btn btn-ghost btn-circle text-white hover:bg-white/10"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    )}

                    {/* Next — hidden on the last image */}
                    {lightboxIndex < mediaMessages.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i + 1); }}
                            className="absolute right-4 btn btn-ghost btn-circle text-white hover:bg-white/10"
                        >
                            <ChevronRight size={28} />
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default MediaGallery;
