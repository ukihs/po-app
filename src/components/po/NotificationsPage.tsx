import React, { useEffect, useRef, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { subscribeAuthAndRole } from '../../lib/auth';
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
import { 
  Bell, 
  FileText, 
  User, 
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

type Noti = {
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

const fmt = (ts: any) => {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' });
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Noti[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');
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
        setItems([]);
        setLoading(false);
        return;
      }

      setRole(userRole);
      setLoading(true);
      setErr('');

      if (userRole === 'buyer' || userRole === 'supervisor') {
        const q = query(
          collection(db, 'notifications'),
          where('toUserUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        stopSnap.current = onSnapshot(
          q,
          (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setItems(rows as Noti[]);
            setLoading(false);
          },
          (e) => {
            console.error('notifications error:', e);
            setErr((e?.message || '').toString());
            setItems([]);
            setLoading(false);
          }
        );
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

        let personalNotifs: Noti[] = [];
        let roleNotifs: Noti[] = [];
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

          setItems(uniqueNotifs);
          setLoading(false);
        };

        const unsubPersonal = onSnapshot(personalQ, (snap) => {
          personalNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Noti[];
          loadedCount = Math.max(loadedCount, 1);
          combineAndSetNotifications();
        }, (e) => {
          console.error('personal notifications error:', e);
          setErr((e?.message || '').toString());
          setLoading(false);
        });

        const unsubRole = onSnapshot(roleQ, (snap) => {
          roleNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Noti[];
          loadedCount = Math.max(loadedCount, 2);
          combineAndSetNotifications();
        }, (e) => {
          console.error('role notifications error:', e);
          setErr((e?.message || '').toString());
          setLoading(false);
        });

        stopSnap.current = () => {
          unsubPersonal();
          unsubRole();
        };
      } else {
        setItems([]);
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

  const markReadAndGo = async (n: Noti) => {
    try {
      if (!n.read) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
      
      if (role === 'buyer') {
        window.location.href = '/orders/tracking';
      } else if (role === 'supervisor') {
        window.location.href = '/orders/tracking';
      } else if (role === 'procurement') {
        window.location.href = '/orders/list';
      }
    } catch (e) {
      console.error(e);
      if (role === 'buyer') {
        window.location.href = '/orders/tracking';
      } else {
        window.location.href = '/orders/list';
      }
    }
  };

  if (loading) return <div className="px-4 py-8">กำลังโหลดแจ้งเตือน...</div>;

  if (err && /requires an index/i.test(err)) {
    return (
      <div className="px-4 py-8 text-rose-700 text-sm">
        เกิดข้อผิดพลาดในการโหลดข้อมูล<br />
        {err}
        <br />
        ถ้า error มีคำว่า requires an index ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรีเฟรชใหม่อีกครั้ง
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Bell className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการแจ้งเตือน</h3>
          <p className="text-gray-600">การแจ้งเตือนต่างๆ จะแสดงที่นี่</p>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (kind?: string) => {
    switch (kind) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-error" />;
      case 'status_update':
        return <FileText className="w-5 h-5 text-info" />;
      default:
        return <Bell className="w-5 h-5 text-warning" />;
    }
  };

  const getNotificationColor = (kind?: string, read?: boolean) => {
    if (read) return 'border-gray-200 bg-white';
    
    switch (kind) {
      case 'approved':
        return 'border-green-400 bg-white';
      case 'rejected':
        return 'border-red-400 bg-white';
      case 'status_update':
        return 'border-blue-400 bg-white';
      default:
        return 'border-yellow-400 bg-white';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'buyer': return 'ผู้ขอซื้อ';
      case 'supervisor': return 'หัวหน้างาน';
      case 'procurement': return 'ฝ่ายจัดซื้อ';
      default: return role;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ข้อความแจ้งเตือนระบบ</h2>
        <p className="text-sm text-gray-600 mt-1">
          แจ้งเตือนสำหรับ{getRoleDisplayName(role || '')}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((n) => (
          <div
            key={n.id}
            className={`card border-l-4 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 ${getNotificationColor(n.kind, n.read)}`}
            onClick={() => markReadAndGo(n)}
          >
            <div className="card-body p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(n.kind)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">
                          เลขที่: {n.orderNo ? `#${n.orderNo}` : 'N/A'}
                        </span>
                        {!n.read && (
                          <span className="badge badge-xs badge-primary">ใหม่</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span>จาก: {n.fromUserName || 'ระบบ'}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{getRoleDisplayName(role || '')}</span>
                      </div>

                      <h3 className={`font-medium mb-1 ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </h3>

                      {n.message && (
                        <p className="text-sm text-gray-600 mb-2">
                          {n.message}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-500">
                        {fmt(n.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}