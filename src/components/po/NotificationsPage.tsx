// src/components/po/NotificationsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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

type Noti = {
  id: string;
  title: string;
  message?: string;
  orderId?: string;
  createdAt?: any;   // Firestore Timestamp
  read?: boolean;
  toUserUid?: string;
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
  const stopSnap = useRef<Unsubscribe | null>(null);
  const stopAuth = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    stopAuth.current = onAuthStateChanged(auth, (user) => {
      // เคลียร์ listener เก่าทุกครั้งที่ user เปลี่ยน
      if (stopSnap.current) {
        stopSnap.current();
        stopSnap.current = null;
      }

      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr('');

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
      // มาร์คอ่านแล้ว (ถ้ายังไม่อ่าน)
      if (!n.read) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
      // ไปหน้าติดตามสถานะ (จะทำ anchor/param ภายหลังได้)
      window.location.href = '/orders/tracking';
    } catch (e) {
      console.error(e);
      // ไม่ต้อง block การนำทาง ถ้าอัพเดตไม่ผ่านก็ข้ามไปก่อน
      window.location.href = '/orders/tracking';
    }
  };

  if (loading) return <div className="px-4 py-8">กำลังโหลดแจ้งเตือน...</div>;

  // ถ้าเจอ error “requires an index…” ให้โชว์คำแนะนำ (ข้อความยาวจาก Firestore จะมีลิงก์สร้าง index)
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
    return <div className="px-4 py-8">ยังไม่มีการแจ้งเตือนในระบบ</div>;
  }

  return (
    <ul className="space-y-3 px-4 py-4">
      {items.map((n, idx) => (
        <li
          key={n.id}
          className={`rounded-xl border bg-white p-4 shadow-sm transition hover:bg-slate-50 cursor-pointer ${
            !n.read ? 'border-sky-300' : 'border-slate-200'
          }`}
          onClick={() => markReadAndGo(n)}
        >
          <div className="flex items-start gap-3">
            {/* เลขรัน 1,2,3... */}
            <span className="mt-1 w-6 text-right tabular-nums text-slate-500">{idx + 1}.</span>

            <div className="flex-1">
              <div className={`font-medium ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                {n.title}
              </div>

              <div className="mt-0.5 text-sm text-slate-600">
                เลขใบสั่งซื้อ:{' '}
                <span className="font-mono">{n.orderId ?? '-'}</span>
                {' · '}ส่งถึง: <span className="font-medium">หัวหน้างาน</span>
              </div>

              {n.message && (
                <div className="mt-1 text-sm text-slate-500">{n.message}</div>
              )}
            </div>

            <div className="text-xs text-slate-500">{fmt(n.createdAt)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
