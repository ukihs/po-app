import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';

type Status = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let offOrders: any;

    const offAuth = auth.onAuthStateChanged((u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }

      // อ่านเฉพาะใบสั่งซื้อของ uid นี้ + เรียงตามเวลาสร้าง
      const q = query(
        collection(db, 'orders'),
        where('requesterUid', '==', u.uid),
        orderBy('createdAt', 'desc')
      );

      // subscribe และ handle error (เช่น ต้องสร้าง Index)
      offOrders?.();
      offOrders = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              date: data.date || '',
              requesterName: data.requesterName || '',
              total: Number(data.total || 0),
              status: (data.status || 'pending') as Status,
              createdAt: data.createdAt, // อาจเป็น FieldValue/ServerTimestamp — แสดงแบบปลอดภัยด้านล่าง
            };
          });
          setRows(list);
          setErr('');
          setLoading(false);
        },
        (e) => {
          setErr(String(e?.message || e));
          setLoading(false);
        }
      );
    });

    return () => {
      offOrders?.();
      offAuth();
    };
  }, []);

  if (loading) return <div className="container-nice py-6">กำลังโหลด...</div>;

  if (err) {
    return (
      <div className="container-nice py-6">
        <div className="text-rose-600 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
        <pre className="text-xs whitespace-pre-wrap break-all bg-rose-50 p-3 rounded">{err}</pre>
        <div className="mt-3 text-sm text-slate-600">
          ถ้า error มีคำว่า <code>requires an index</code> ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรอสักครู่ จากนั้นรีเฟรชหน้าอีกครั้ง
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="container-nice py-6">
        <h2 className="text-xl font-semibold mb-2">ติดตามสถานะใบสั่งซื้อ</h2>
        <div className="text-slate-600">
          ยังไม่มีใบสั่งซื้อในระบบ — <a className="underline" href="/orders/create">สร้างใบสั่งซื้อแรก</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-nice py-6">
      <h2 className="text-xl font-semibold mb-4">ติดตามสถานะใบสั่งซื้อ</h2>

      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-600">
              <th className="px-3 py-2 w-44">วันที่สร้าง</th>
              <th className="px-3 py-2">ผู้สั่งซื้อ</th>
              <th className="px-3 py-2">วันที่เอกสาร</th>
              <th className="px-3 py-2 w-40 text-right">ยอดรวม (บาท)</th>
              <th className="px-3 py-2 w-44">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-slate-50/40">
                <td className="px-3 py-2">
                  {/* ปลอดภัยกับทุกชนิด: ถ้ามี toDate ให้ใช้, ถ้าไม่มีให้แสดงเครื่องหมาย — */}
                  {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('th-TH') : '—'}
                </td>
                <td className="px-3 py-2">{r.requesterName || '—'}</td>
                <td className="px-3 py-2">{r.date || '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {Number(r.total || 0).toLocaleString('th-TH')}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-700">
                    {labelStatus(r.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function labelStatus(s: Status) {
  switch (s) {
    case 'pending': return 'รออนุมัติ';
    case 'approved': return 'อนุมัติแล้ว';
    case 'rejected': return 'ไม่อนุมัติ';
    case 'in_progress': return 'กำลังจัดซื้อ';
    case 'delivered': return 'รับของแล้ว';
    default: return String(s);
  }
}
