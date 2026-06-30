import { create } from "zustand";

export interface AppNotification {
  id: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: crypto.randomUUID(),
          read: false,
          createdAt: Date.now(),
        },
        ...state.notifications,
      ],
    }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearAll: () => {
    set({ notifications: [] });
  },
}));
