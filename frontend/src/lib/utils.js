// Formats a date string into a 24-hour HH:MM time string for use in message bubbles
export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

// Returns a human-friendly "last seen" string, e.g. "Just now", "Today at 14:30",
// "Yesterday at 09:15", or a full date for anything older
export function formatLastSeen(date) {
    if (!date) return "Long ago";

    const lastSeenDate = new Date(date);
    const now = new Date();

    const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 1) return "Just now";

    // Compare calendar dates rather than a fixed 24 h window so "today" and "yesterday"
    // match what the user actually sees on their calendar
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

    // For older dates, include the year only if it differs from the current one
    return lastSeenDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: lastSeenDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }) + ` at ${timeString}`;
}