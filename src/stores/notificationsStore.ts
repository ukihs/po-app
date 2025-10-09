import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  arrayUnion,
  writeBatch,
  limit
} from 'firebase/firestore';
type Unsubscribe = () => void;
import { db } from '../firebase/client';
import { COLLECTIONS } from '../lib/constants';
import type { Notification, NotificationKind, UserRole, NotificationRecipient } from '../types';

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
  markAsRead: (notificationId: string, userUid: string) => Promise<void>;
  markAllAsRead: (userUid: string) => Promise<void>;
  cleanup: () => void;
  getNotificationsByKind: (kind: NotificationKind) => Notification[];
  getUnreadNotifications: (userUid: string) => Notification[];
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
      set({ 
        notifications, 
        unreadCount: 0,
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

      // Admin doesn't get order-related notifications
      if (role === 'admin') {
        set({ 
          loading: false, 
          notifications: [],
          unreadCount: 0
        });
        return;
      }

      set({ loading: true, error: null });

      const userRecipient: NotificationRecipient = { type: 'user', id: userUid };
      const roleRecipient: NotificationRecipient = { type: 'role', id: role };

      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('recipients', 'array-contains', userRecipient),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const newUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let notifications = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              readBy: data.readBy || [],
              recipients: data.recipients || []
            };
          }) as Notification[];

          const roleQ = query(
            collection(db, COLLECTIONS.NOTIFICATIONS),
            where('recipients', 'array-contains', roleRecipient),
            orderBy('createdAt', 'desc'),
            limit(100)
          );

          onSnapshot(roleQ, (roleSnapshot) => {
            const roleNotifications = roleSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                readBy: data.readBy || [],
                recipients: data.recipients || []
              };
            }) as Notification[];

            const allNotifications = [...notifications, ...roleNotifications];
            const uniqueNotifications = allNotifications.filter((notification, index, arr) => 
              arr.findIndex(n => n.id === notification.id) === index
            );

            uniqueNotifications.sort((a, b) => {
              if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
              return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
            });

            const now = new Date();
            const activeNotifications = uniqueNotifications.filter(n => {
              if (!n.expiresAt) return true;
              const expiresAt = n.expiresAt.toDate ? n.expiresAt.toDate() : new Date(n.expiresAt);
              return expiresAt > now;
            });

            get().setNotifications(activeNotifications);
            set({ loading: false });
          });
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
    },

    markAsRead: async (notificationId: string, userUid: string) => {
      try {
        await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), { 
          readBy: arrayUnion(userUid),
          updatedAt: new Date()
        });
        
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId 
              ? { ...n, readBy: [...(n.readBy || []), userUid] } 
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      } catch (error) {
        console.error('Error marking notification as read:', error);
        set({ error: String(error) });
      }
    },

    markAllAsRead: async (userUid: string) => {
      const { notifications } = get();
      const unreadNotifications = notifications.filter(n => 
        !n.readBy?.includes(userUid)
      );
      
      if (unreadNotifications.length === 0) return;

      try {
        const batch = writeBatch(db);
        
        unreadNotifications.forEach(n => {
          const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, n.id);
          batch.update(notifRef, {
            readBy: arrayUnion(userUid),
            updatedAt: new Date()
          });
        });
        
        await batch.commit();
        
        set((state) => ({
          notifications: state.notifications.map(n => 
            !n.readBy?.includes(userUid)
              ? { ...n, readBy: [...(n.readBy || []), userUid] }
              : n
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

    getUnreadNotifications: (userUid: string) => {
      const { notifications } = get();
      return notifications.filter(n => !n.readBy?.includes(userUid));
    }
  }))
);

export const useNotifications = () => useNotificationsStore((state) => state.notifications);
export const useUnreadCount = (userUid?: string) => 
  useNotificationsStore((state) => {
    if (!userUid) return 0;
    return state.notifications.filter(n => !n.readBy?.includes(userUid)).length;
  });
export const useNotificationsLoading = () => useNotificationsStore((state) => state.loading);
export const useNotificationsError = () => useNotificationsStore((state) => state.error);

export const useNotificationsByKind = (kind: NotificationKind) => 
  useNotificationsStore((state) => state.getNotificationsByKind(kind));

export const useUnreadNotifications = (userUid: string) => 
  useNotificationsStore((state) => state.getUnreadNotifications(userUid));

export const useNotificationStats = () => 
  useNotificationsStore((state) => {
    const notifications = state.notifications;
    return {
      total: notifications.length,
      unread: notifications.length,
      read: 0,
      approvalRequests: notifications.filter(n => n.kind === 'approval_request').length,
      approved: notifications.filter(n => n.kind === 'approved').length,
      rejected: notifications.filter(n => n.kind === 'rejected').length,
      statusUpdates: notifications.filter(n => n.kind === 'status_update').length
    };
  });