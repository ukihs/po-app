import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc
} from 'firebase/firestore';
type Unsubscribe = () => void;
import { db } from '../firebase/client';
import { COLLECTIONS } from '../lib/constants';
import type { Notification, NotificationKind, UserRole } from '../types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  unsubscribe: Unsubscribe | null;
}

interface NotificationsActions {
  setNotifications: (notifications: Notification[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchNotifications: (userUid: string, role: UserRole) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  cleanup: () => void;
  getNotificationsByKind: (kind: NotificationKind) => Notification[];
  getUnreadNotifications: () => Notification[];
}

type NotificationsStore = NotificationsState & NotificationsActions;

export const useNotificationsStore = create<NotificationsStore>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    lastFetch: null,
    unsubscribe: null,
    setNotifications: (notifications) => {
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ 
        notifications, 
        unreadCount,
        lastFetch: Date.now(),
        error: null 
      });
    },

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    fetchNotifications: (userUid: string, role: UserRole) => {
      const { unsubscribe } = get();
      
      if (unsubscribe) {
        unsubscribe();
      }

      set({ loading: true, error: null });

      if (role === 'buyer') {
        const q = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('toUserUid', '==', userUid),
          orderBy('createdAt', 'desc')
        );

        const newUnsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const notifications = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            })) as Notification[];
            
            get().setNotifications(notifications);
            set({ loading: false });
          },
          (error) => {
            console.error('Notifications fetch error:', error);
            set({ 
              error: String(error?.message || error), 
              loading: false,
              notifications: [],
              unreadCount: 0
            });
          }
        );

        set({ unsubscribe: newUnsubscribe });
      } else if (role === 'supervisor' || role === 'procurement') {
        const personalQ = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('toUserUid', '==', userUid),
          orderBy('createdAt', 'desc')
        );

        const roleQ = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('forRole', '==', role),
          orderBy('createdAt', 'desc')
        );

        let personalNotifications: Notification[] = [];
        let roleNotifications: Notification[] = [];
        let loadedCount = 0;

        const combineAndSetNotifications = () => {
          if (loadedCount < 2) return;
          
          const allNotifications = [...personalNotifications, ...roleNotifications];
          const uniqueNotifications = allNotifications.filter((notification, index, arr) => 
            arr.findIndex(n => n.id === notification.id) === index
          );
          
          uniqueNotifications.sort((a, b) => {
            if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          });

          get().setNotifications(uniqueNotifications);
          set({ loading: false });
        };

        const unsubPersonal = onSnapshot(personalQ, (snapshot) => {
          personalNotifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Notification[];
          loadedCount = Math.max(loadedCount, 1);
          combineAndSetNotifications();
        }, (error) => {
          console.error('Personal notifications error:', error);
          set({ 
            error: String(error?.message || error), 
            loading: false 
          });
        });

        const unsubRole = onSnapshot(roleQ, (snapshot) => {
          roleNotifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Notification[];
          loadedCount = Math.max(loadedCount, 2);
          combineAndSetNotifications();
        }, (error) => {
          console.error('Role notifications error:', error);
          set({ 
            error: String(error?.message || error), 
            loading: false 
          });
        });

        const newUnsubscribe = () => {
          unsubPersonal();
          unsubRole();
        };

        set({ unsubscribe: newUnsubscribe });
      } else {
        set({ 
          loading: false, 
          error: 'ไม่พบ role ในระบบ',
          notifications: [],
          unreadCount: 0
        });
      }
    },

    markAsRead: async (notificationId: string) => {
      try {
        await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), { 
          read: true,
          readAt: new Date()
        });
        
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      } catch (error) {
        console.error('Error marking notification as read:', error);
        set({ error: String(error) });
      }
    },

    markAllAsRead: async () => {
      const { notifications } = get();
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) return;

      try {
        const promises = unreadNotifications.map(n => 
          updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, n.id), { 
            read: true,
            readAt: new Date()
          })
        );
        
        await Promise.all(promises);
        
        set((state) => ({
          notifications: state.notifications.map(n => 
            !n.read ? { ...n, read: true, readAt: new Date() } : n
          ),
          unreadCount: 0
        }));
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        set({ error: String(error) });
      }
    },

    cleanup: () => {
      const { unsubscribe } = get();
      if (unsubscribe) {
        unsubscribe();
        set({ unsubscribe: null });
      }
    },

    getNotificationsByKind: (kind: NotificationKind) => {
      const { notifications } = get();
      return notifications.filter(n => n.kind === kind);
    },

    getUnreadNotifications: () => {
      const { notifications } = get();
      return notifications.filter(n => !n.read);
    }
  }))
);

export const useNotifications = () => useNotificationsStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationsStore((state) => state.unreadCount);
export const useNotificationsLoading = () => useNotificationsStore((state) => state.loading);
export const useNotificationsError = () => useNotificationsStore((state) => state.error);

export const useNotificationsByKind = (kind: NotificationKind) => 
  useNotificationsStore((state) => state.getNotificationsByKind(kind));

export const useUnreadNotifications = () => 
  useNotificationsStore((state) => state.getUnreadNotifications());

export const useNotificationStats = () => 
  useNotificationsStore((state) => {
    const notifications = state.notifications;
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      read: notifications.filter(n => n.read).length,
      approvalRequests: notifications.filter(n => n.kind === 'approval_request').length,
      approved: notifications.filter(n => n.kind === 'approved').length,
      rejected: notifications.filter(n => n.kind === 'rejected').length,
      statusUpdates: notifications.filter(n => n.kind === 'status_update').length
    };
  });