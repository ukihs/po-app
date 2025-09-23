"use client";

import React, { useEffect, useRef, useState } from 'react';
import { auth, db } from '../../firebase/client';
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
  ArrowRight,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

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

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#6EC1E4]" />
          </div>
          <p className="mt-4 text-muted-foreground">กำลังโหลดแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  if (err && /requires an index/i.test(err)) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <div className="text-sm mt-2">
              {err}
              <br />
              ถ้า error มีคำว่า requires an index ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรีเฟรชใหม่อีกครั้ง
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Bell className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">ยังไม่มีการแจ้งเตือน</h3>
          <p className="text-muted-foreground">การแจ้งเตือนต่างๆ จะแสดงที่นี่</p>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (kind?: string) => {
    switch (kind) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'status_update':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  const getNotificationBorderColor = (kind?: string, read?: boolean) => {
    if (read) return 'border-l-muted';
    
    switch (kind) {
      case 'approved':
        return 'border-l-emerald-500';
      case 'rejected':
        return 'border-l-red-500';
      case 'status_update':
        return 'border-l-blue-500';
      default:
        return 'border-l-amber-500';
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
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bell className="w-8 h-8 text-[#2b9ccc]" />
          ข้อความแจ้งเตือน
        </h1>
        <p className="text-muted-foreground">
          แจ้งเตือนการอนุมัติใบขอซื้อสำหรับ{getRoleDisplayName(role || '')}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((n) => (
          <Card
            key={n.id}
            className={`border-l-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${getNotificationBorderColor(n.kind, n.read)}`}
            onClick={() => markReadAndGo(n)}
          >
            <CardContent className="px-3 py-1">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getNotificationIcon(n.kind)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#6EC1E4]">
                        #{n.orderNo || 'N/A'}
                      </span>
                      {!n.read && (
                        <Badge variant="secondary" className="bg-[#6EC1E4] text-white hover:bg-[#6EC1E4] text-xs px-1.5 py-0.5">
                          ใหม่
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmt(n.createdAt)}
                    </div>
                  </div>
                  
                  <h3 className={`text-sm font-medium mb-1 ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {n.title}
                  </h3>

                  {n.message && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {n.message}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>จาก: {n.fromUserName || 'ระบบ'}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{getRoleDisplayName(role || '')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}