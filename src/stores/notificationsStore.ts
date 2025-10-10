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
  userUnsubscribe: Unsubscribe | null;
  roleUnsubscribe: Unsubscribe | null;
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
    userUnsubscribe: null,
    roleUnsubscribe: null,
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
      const { userUnsubscribe, roleUnsubscribe } = get();
      
      if (userUnsubscribe) userUnsubscribe();
      if (roleUnsubscribe) roleUnsubscribe();

      if (role === 'admin') {
        set({ 
          loading: false, 
          notifications: [],
          unreadCount: 0,
          userUnsubscribe: null,
          roleUnsubscribe: null
        });
        return;
      }

      set({ loading: true, error: null });

      const userRecipient: NotificationRecipient = { type: 'user', id: userUid };
      const roleRecipient: NotificationRecipient = { type: 'role', id: role };

      // Optimized: Use Map for O(n) deduplication instead of O(n²)
      const mergeNotifications = (userNotifications: Notification[], roleNotifications: Notification[]) => {
        const notificationMap = new Map<string, Notification>();
        
        // Add user notifications to map
        userNotifications.forEach(n => notificationMap.set(n.id, n));
        
        // Add role notifications (won't duplicate due to Map)
        roleNotifications.forEach(n => {
          if (!notificationMap.has(n.id)) {
            notificationMap.set(n.id, n);
          }
        });
        
        // Convert to array and sort
        const uniqueNotifications = Array.from(notificationMap.values());
        uniqueNotifications.sort((a, b) => {
          if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        });

        // Filter expired notifications
        const now = new Date();
        const activeNotifications = uniqueNotifications.filter(n => {
          if (!n.expiresAt) return true;
          const expiresAt = n.expiresAt.toDate ? n.expiresAt.toDate() : new Date(n.expiresAt);
          return expiresAt > now;
        });

        get().setNotifications(activeNotifications);
        set({ loading: false });
      };

      let userNotifications: Notification[] = [];
      let roleNotifications: Notification[] = [];
      let userDataReady = false;
      let roleDataReady = false;

      const userQ = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('recipients', 'array-contains', userRecipient),
        orderBy('createdAt', 'desc'),
        limit(25)
      );

      const newUserUnsubscribe = onSnapshot(
        userQ,
        (snapshot) => {
          userNotifications = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              readBy: data.readBy || [],
              recipients: data.recipients || []
            };
          }) as Notification[];

          userDataReady = true;
          if (roleDataReady) {
            mergeNotifications(userNotifications, roleNotifications);
          }
        },
        (error) => {
          console.error('User notifications fetch error:', error);
          set({ 
            error: String(error?.message || error), 
            loading: false
          });
        }
      );

      const roleQ = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('recipients', 'array-contains', roleRecipient),
        orderBy('createdAt', 'desc'),
        limit(25)
      );

      const newRoleUnsubscribe = onSnapshot(
        roleQ,
        (snapshot) => {
          roleNotifications = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              readBy: data.readBy || [],
              recipients: data.recipients || []
            };
          }) as Notification[];

          roleDataReady = true;
          if (userDataReady) {
            mergeNotifications(userNotifications, roleNotifications);
          }
        },
        (error) => {
          console.error('Role notifications fetch error:', error);
          set({ 
            error: String(error?.message || error), 
            loading: false
          });
        }
      );

      set({ 
        userUnsubscribe: newUserUnsubscribe,
        roleUnsubscribe: newRoleUnsubscribe
      });
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
      const { userUnsubscribe, roleUnsubscribe } = get();
      if (userUnsubscribe) {
        userUnsubscribe();
        set({ userUnsubscribe: null });
      }
      if (roleUnsubscribe) {
        roleUnsubscribe();
        set({ roleUnsubscribe: null });
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

// Optimized: Calculate stats in one pass instead of multiple filters
export const useNotificationStats = (userUid?: string) => 
  useNotificationsStore((state) => {
    const notifications = state.notifications;
    
    // Single pass calculation - O(n) instead of O(5n)
    return notifications.reduce((stats, n) => {
      stats.total++;
      
      // Count unread
      if (userUid && !n.readBy?.includes(userUid)) {
        stats.unread++;
      } else if (userUid) {
        stats.read++;
      }
      
      // Count by kind
      switch (n.kind) {
        case 'approval_request':
          stats.approvalRequests++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'status_update':
          stats.statusUpdates++;
          break;
      }
      
      return stats;
    }, {
      total: 0,
      unread: 0,
      read: 0,
      approvalRequests: 0,
      approved: 0,
      rejected: 0,
      statusUpdates: 0
    });
  });