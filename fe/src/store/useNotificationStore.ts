import { create } from "zustand";
import { notificationsApi, type AppNotification } from "../lib/notificationsApi";

interface NotificationState {
  notifications: AppNotification[];
  isLoading: boolean;
  fetchNotifications: (token: string) => Promise<void>;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string, token: string) => Promise<void>;
  markAllAsRead: (token: string) => Promise<void>;
  clearAll: () => void; // local only
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isLoading: false,
  fetchNotifications: async (token: string) => {
    try {
      set({ isLoading: true });
      const data = await notificationsApi.getNotifications(token);
      set({ notifications: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },
  markAsRead: async (id: string, token: string) => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
      await notificationsApi.markAsRead(id, token);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert in case of failure could be handled here
    }
  },
  markAllAsRead: async (token: string) => {
    try {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
      await notificationsApi.markAllAsRead(token);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },
  clearAll: () => {
    set({ notifications: [] });
  },
}));
