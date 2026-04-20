// Ask the user once for notification permission right after they log in.
// If they've already answered (granted or denied), this is a no-op.
export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }
};

// Show a browser notification if permission has been granted.
// onClick focuses the tab and runs an optional callback.
export const showNotification = (title, body, icon, onClick) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const n = new Notification(title, { body, icon });
    n.onclick = () => {
        window.focus();
        onClick?.();
        n.close();
    };
};
