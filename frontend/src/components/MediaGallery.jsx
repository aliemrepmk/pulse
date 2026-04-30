import { motion } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import { X, Images } from "lucide-react";

import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

const MediaGallery = ({ onClose }) => {
    const { messages, selectedUser } = useChatStore();

    // Newest images first, deleted messages excluded
    const slides = messages
        .filter((m) => m.image && !m.deletedForEveryone)
        .reverse()
        .map((m) => ({ src: m.image }));

    // YARL can't render an empty state, so we show our own dark overlay when there are no images
    if (slides.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.96)" }}
            >
                {/* Close button — matches YARL's top-right button style */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-white/70
                               hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={22} />
                </button>

                {/* Empty state content */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.3 }}
                    className="flex flex-col items-center gap-4 text-white/40"
                >
                    <Images size={56} strokeWidth={1} />
                    <div className="text-center">
                        <p className="text-base font-medium text-white/60">No photos yet</p>
                        <p className="text-sm mt-1">
                            Photos shared with {selectedUser.fullName} will appear here.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <Lightbox
            open
            index={0}
            slides={slides}
            close={onClose}
            plugins={[Counter, Zoom, Thumbnails, Download]}
            animation={{
                fade: 280,
                swipe: 420,
                easing: { fade: "ease", swipe: "cubic-bezier(0.25, 1, 0.5, 1)" },
            }}
            carousel={{ finite: false, preload: 3 }}
            counter={{ container: { style: { top: "unset", bottom: 16, left: "50%", transform: "translateX(-50%)", fontSize: 13, opacity: 0.65 } } }}
            thumbnails={{
                position: "bottom",
                width: 72,
                height: 54,
                border: 2,
                borderRadius: 6,
                padding: 3,
                gap: 6,
                imageFit: "cover",
                showToggle: false,
            }}
            zoom={{
                maxZoomPixelRatio: 5,
                zoomInMultiplier: 2,
                scrollToZoom: true,
                doubleTapDelay: 250,
                doubleClickDelay: 250,
                pinchZoomDistanceFactor: 100,
            }}
            styles={{
                container: { backgroundColor: "rgba(0,0,0,0.96)" },
                thumbnailsTrack: { paddingTop: 6, paddingBottom: 6 },
                button: { filter: "none" },
            }}
        />
    );
};

export default MediaGallery;
