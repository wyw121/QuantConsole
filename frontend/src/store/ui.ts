import type { Notification } from '@/types'
import { create } from 'zustand'

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      isRead: false,
    }

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }))

    // 自动移除通知
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== newNotification.id),
        }))
      }, 5000)
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),

  clearAll: () => set({ notifications: [] }),
}))

// UI 状态管理
interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  loading: Record<string, boolean>

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLoading: (key: string, loading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  loading: {},

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTheme: (theme) => set({ theme }),

  setLoading: (key, loading) =>
    set((state) => ({
      loading: { ...state.loading, [key]: loading },
    })),
}))
