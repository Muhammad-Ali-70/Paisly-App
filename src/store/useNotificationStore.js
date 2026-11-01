import { create } from 'zustand';
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markAllAsReadApi,
} from '../services/notificationService';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  loadingMore: false,
  pagination: null,

  fetchNotifications: async ({ page = 1, unreadOnly = false } = {}) => {
    // Page 1 drives the full-screen skeleton; later pages only the list footer
    set(page === 1 ? { loading: true } : { loadingMore: true });
    try {
      const data = await getNotificationsApi({ page, unreadOnly });
      set((state) => ({
        notifications: page === 1 ? data.notifications : [...state.notifications, ...data.notifications],
        pagination: data.pagination,
        loading: false,
        loadingMore: false,
      }));
    } catch (err) {
      set({ loading: false, loadingMore: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await getUnreadCountApi();
      set({ unreadCount: data.count });
    } catch (_) {}
  },

  markAsRead: async (id) => {
    try {
      await markAsReadApi(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (_) {}
  },

  markAllAsRead: async () => {
    try {
      await markAllAsReadApi();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (_) {}
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0, pagination: null }),
}));

export default useNotificationStore;
