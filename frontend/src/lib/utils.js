export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export function formatLastSeen(date) {
    if (!date) return "Long ago";

    const lastSeenDate = new Date(date);
    const now = new Date();
    
    const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    
    if (diffInMinutes < 1) return "Just now";
    
    const isToday =
        lastSeenDate.getDate() === now.getDate() &&
        lastSeenDate.getMonth() === now.getMonth() &&
        lastSeenDate.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
        lastSeenDate.getDate() === yesterday.getDate() &&
        lastSeenDate.getMonth() === yesterday.getMonth() &&
        lastSeenDate.getFullYear() === yesterday.getFullYear();

    const timeString = lastSeenDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    if (isToday) return `Today at ${timeString}`;
    if (isYesterday) return `Yesterday at ${timeString}`;

    return lastSeenDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: lastSeenDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }) + ` at ${timeString}`;
}