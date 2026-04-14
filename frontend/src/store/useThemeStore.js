import { create } from "zustand";

export const useThemeStore = create((set) => ({
    // Read from localStorage so the user's chosen theme survives a page refresh
    theme: localStorage.getItem("chat-theme") || "light",

    // Save to localStorage and update state so the change is reflected immediately everywhere
    setTheme: (theme) => {
       localStorage.setItem("chat-theme", theme);
       set({ theme });
    },
}));