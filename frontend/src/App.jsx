import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";
import { requestNotificationPermission } from "./lib/notifications";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  const { subscribeToGlobalMessages, unsubscribeFromGlobalMessages, getUnreadCounts } = useChatStore();

  // Verify whether the user is already logged in as soon as the app loads
  useEffect(() => {
    checkAuth()
  }, [checkAuth]);

  // Start the always-on message listener and load initial unread counts once we know the user is logged in
  useEffect(() => {
    if (!authUser) return;
    subscribeToGlobalMessages();
    getUnreadCounts();
    // Ask for notification permission right after login so the user knows why we're asking
    requestNotificationPermission();
    return () => unsubscribeFromGlobalMessages();
  }, [authUser]);

  // Don't render anything until we know the auth state — avoids a flash of the wrong page
  if(isCheckingAuth && !authUser) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin" />
    </div>
  );

  return (
    // The data-theme attribute here is what makes DaisyUI swap colour palettes globally
    <div data-theme={theme} className="bg-base-100 text-base-content min-h-screen">
      <Navbar />

      <Routes>
        {/* Unauthenticated users get redirected to /login; authenticated ones can't revisit /login or /signup */}
        <Route  path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route  path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route  path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route  path="/settings" element={<SettingsPage />} />
        <Route  path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;