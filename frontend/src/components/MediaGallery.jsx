import { useChatStore } from "../store/useChatStore";

import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

const MediaGallery = ({ onClose }) => {
    const { messages } = useChatStore();

    // Newest images first, deleted messages excluded
    const slides = messages
        .filter((m) => m.image && !m.deletedForEveryone)
        .reverse()
        .map((m) => ({ src: m.image }));

    return (
        <Lightbox
            open
            index={0}
            slides={slides}
            close={onClose}
            plugins={[Counter, Zoom, Thumbnails, Download]}
            // Smoother, slightly slower transitions to give the images room to breathe
            animation={{
                fade: 280,
                swipe: 420,
                easing: { fade: "ease", swipe: "cubic-bezier(0.25, 1, 0.5, 1)" },
            }}
            // Pre-load the adjacent images so navigating never shows a blank frame
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
                // Active thumbnail highlighted with a bright border
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
                // Near-black backdrop so images pop
                container: { backgroundColor: "rgba(0,0,0,0.96)" },
                // Subtle accent on the active thumbnail
                thumbnailsTrack: { paddingTop: 6, paddingBottom: 6 },
                button: { filter: "none" },
            }}
        />
    );
};

export default MediaGallery;
