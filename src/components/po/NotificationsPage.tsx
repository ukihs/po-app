import React, { useEffect, useState } from 'react';
import { subscribeAuthAndRole } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';

type Noti = {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
  type?: string;
  orderId?: string;
  orderNo?: string;
  targetRole?: 'buyer' | 'supervisor' | 'procurement';
  targetUid?: string;
};

export default function NotificationsPage() {
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | null>(null);
  const [uid, setUid] = useState<string>('');
  const [rows, setRows] = useState<Noti[]>([]);

  useEffect(() => {
    let offList: (() => void) | null = null;
    const offAuth = subscribeAuthAndRole((user, r) => {
      setRole(r);
      setUid(user?.uid ?? '');

      if (!user || !r) return;
      if (offList) offList();

      const base = collection(db, 'notifications');
      const q =
        r === 'buyer'
          ? query(base, where('targetUid', '==', user.uid), orderBy('createdAt', 'desc'))
          : query(base, where('targetRole', '==', r), orderBy('createdAt', 'desc'));

      offList = onSnapshot(q, (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      });
    });

    return () => {
      if (offList) offList();
      offAuth();
    };
  }, []);

  if (!role) return null;

  return (
    <div className="container-nice page-narrow py-8">
      <div className="card">
        <div className="card-pad">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">การแจ้งเตือน</h2>

          {rows.length === 0 ? (
            <div className="text-slate-600 text-center py-10">ยังไม่มีการแจ้งเตือน</div>
          ) : (
            <ul className="space-y-3">
              {rows.map((n) => (
                <li key={n.id} className="glass rounded-xl border p-4">
                  <div className="font-medium">{n.title ?? 'การแจ้งเตือน'}</div>
                  <div className="text-sm text-slate-600 mt-1">{n.message}</div>
                  {n.orderNo && (
                    <div className="text-xs text-slate-500 mt-1">เลขที่คำขอ: {n.orderNo}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
