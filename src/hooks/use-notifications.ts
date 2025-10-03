import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/client';
import { subscribeAuthAndRole } from '../lib/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

export type Notification = {
  id: string;
  title: string;
  message?: string;
  orderId?: string;
  orderNo?: number;
  createdAt?: any;
  read?: boolean;
  toUserUid?: string;
  fromUserName?: string;
  kind?: 'approval_request' | 'approved' | 'rejected' | 'status_update';
  forRole?: 'procurement' | 'supervisor' | 'buyer' | 'superadmin';
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | 'superadmin' | null>(null);
  
  const stopSnap = useRef<Unsubscribe | null>(null);
  const stopAuth = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    stopAuth.current = subscribeAuthAndRole((user, userRole) => {
      if (stopSnap.current) {
        stopSnap.current();
        stopSnap.current = null;
      }

      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      setRole(userRole);
      setLoading(true);
      setError('');

      if (userRole === 'buyer') {
        const q = query(
          collection(db, 'notifications'),
          where('toUserUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        stopSnap.current = onSnapshot(
          q,
          (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setNotifications(rows as Notification[]);
            setUnreadCount(rows.filter((n: Notification) => !n.read).length);
            setLoading(false);
          },
          (e) => {
            console.error('notifications error:', e);
            setError((e?.message || '').toString());
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
          }
        );
      } else if (userRole === 'supervisor') {
        const personalQ = query(
          collection(db, 'notifications'),
          where('toUserUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const roleQ = query(
          collection(db, 'notifications'),
          where('forRole', '==', 'supervisor'),
          orderBy('createdAt', 'desc')
        );

        let personalNotifs: Notification[] = [];
        let roleNotifs: Notification[] = [];
        let loadedCount = 0;

        const combineAndSetNotifications = () => {
          if (loadedCount < 2) return;
          
          const allNotifs = [...personalNotifs, ...roleNotifs];
          const uniqueNotifs = allNotifs.filter((notif, index, arr) => 
            arr.findIndex(n => n.id === notif.id) === index
          );
          
          uniqueNotifs.sort((a, b) => {
            if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          });

          setNotifications(uniqueNotifs);
          setUnreadCount(uniqueNotifs.filter(n => !n.read).length);
          setLoading(false);
        };

        const unsubPersonal = onSnapshot(personalQ, (snap) => {
          personalNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notification[];
          loadedCount = Math.max(loadedCount, 1);
          combineAndSetNotifications();
        }, (e) => {
          console.error('personal notifications error:', e);
          setError((e?.message || '').toString());
          setLoading(false);
        });

        const unsubRole = onSnapshot(roleQ, (snap) => {
          roleNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notification[];
          loadedCount = Math.max(loadedCount, 2);
          combineAndSetNotifications();
        }, (e) => {
          console.error('role notifications error:', e);
          setError((e?.message || '').toString());
          setLoading(false);
        });

        stopSnap.current = () => {
          unsubPersonal();
          unsubRole();
        };
      } else if (userRole === 'procurement') {
        const personalQ = query(
          collection(db, 'notifications'),
          where('toUserUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const roleQ = query(
          collection(db, 'notifications'),
          where('forRole', '==', 'procurement'),
          orderBy('createdAt', 'desc')
        );

        let personalNotifs: Notification[] = [];
        let roleNotifs: Notification[] = [];
        let loadedCount = 0;

        const combineAndSetNotifications = () => {
          if (loadedCount < 2) return;
          
          const allNotifs = [...personalNotifs, ...roleNotifs];
          const uniqueNotifs = allNotifs.filter((notif, index, arr) => 
            arr.findIndex(n => n.id === notif.id) === index
          );
          
          uniqueNotifs.sort((a, b) => {
            if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          });

          setNotifications(uniqueNotifs);
          setUnreadCount(uniqueNotifs.filter(n => !n.read).length);
          setLoading(false);
        };

        const unsubPersonal = onSnapshot(personalQ, (snap) => {
          personalNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notification[];
          loadedCount = Math.max(loadedCount, 1);
          combineAndSetNotifications();
        }, (e) => {
          console.error('personal notifications error:', e);
          setError((e?.message || '').toString());
          setLoading(false);
        });

        const unsubRole = onSnapshot(roleQ, (snap) => {
          roleNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notification[];
          loadedCount = Math.max(loadedCount, 2);
          combineAndSetNotifications();
        }, (e) => {
          console.error('role notifications error:', e);
          setError((e?.message || '').toString());
          setLoading(false);
        });

        stopSnap.current = () => {
          unsubPersonal();
          unsubRole();
        };
      } else {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
    });

    return () => {
      if (stopSnap.current) stopSnap.current();
      if (stopAuth.current) stopAuth.current();
      stopSnap.current = null;
      stopAuth.current = null;
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { 
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(n => 
        updateDoc(doc(db, 'notifications', n.id), { 
          read: true,
          readAt: new Date()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    role,
    markAsRead,
    markAllAsRead
  };
}