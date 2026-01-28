import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedToken = localStorage.getItem("smartstreet_token");
    const storedUser = localStorage.getItem("smartstreet_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setInitializing(false);
  }, []);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("smartstreet_token", nextToken);
    localStorage.setItem("smartstreet_user", JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("smartstreet_token");
    localStorage.removeItem("smartstreet_user");
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persistSession(data.token, data.user);
      return data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async payload => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register", payload);
      persistSession(data.token, data.user);
      return data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to register");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      loading,
      error,
      login,
      register,
      logout,
      notifications,
      unreadCount,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead
    }),
    [user, token, initializing, loading, error, notifications, unreadCount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
