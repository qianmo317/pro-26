import { create } from 'zustand';
import type { AppState, TaskNotification } from '../types';

const MAX_NOTIFICATIONS = 50;

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  currentPage: 'dashboard',
  setCurrentPage: (page: string) => set({ currentPage: page }),
  notifications: [],
  addNotification: (notification) =>
    set((state) => {
      const newNotification: TaskNotification = {
        ...notification,
        id: String(Date.now()),
        read: false,
        createTime: new Date().toLocaleString(),
      };
      const newNotifications = [newNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
      return { notifications: newNotifications };
    }),
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearAllNotifications: () => set({ notifications: [] }),
  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
