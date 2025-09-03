import React, { useEffect, useState } from 'react';
import { listenOrdersMine, listenOrdersAll, type Order } from '../../lib/poApi';
import { subscribeAuthAndRole } from '../../lib/auth';

export default function TrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<'buyer'|'supervisor'|'procurement'|null>(null);
  const [uid, setUid] = useState<string>('');

  useEffect(() => {
    let offOrders: (()=>void)|null = null;
    const off = subscribeAuthAndRole((user, r) => {
      if (!user || !r) return;
      setRole(r); setUid(user.uid);
      if (offOrders) offOrders();
      // buyer เห็นเฉพาะของตัวเอง, role อื่นๆ เห็นทั้งหมด (เผื่อใช้หน้าเดียว)
      offOrders = (r === 'buyer'
        ? listenOrdersMine(user.uid, setOrders)
        : listenOrdersAll(setOrders)
      );
    });
    return () => { if (offOrders) offOrders(); off(); };
  }, []);

  if (!role) return null;

  return (
    <div className="container-nice page-narrow py-8">
      <div className="card"><div className="card-pad">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">ติดตามสถานะใบสั่งซื้อ</h2>

        {orders.length === 0 ? (
          <div className="text-center text-slate-600 py-10">
            ยังไม่มีใบสั่งซื้อในระบบ<br />
            {role==='buyer' && <a href="/orders/create" className="text-slate-900 font-medium underline">สร้างใบสั่งซื้อแรก</a>}
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">เลขที่</th>
                  <th className="px-3 py-2">วันที่</th>
                  <th className="px-3 py-2">ผู้ขอ</th>
                  <th className="px-3 py-2 text-right">ยอดรวม (บาท)</th>
                  <th className="px-3 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="px-3 py-2 font-medium">{o.orderNo}</td>
                    <td className="px-3 py-2">{o.date}</td>
                    <td className="px-3 py-2">{o.requester}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{o.totalAmount?.toLocaleString('th-TH') ?? 0}</td>
                    <td className="px-3 py-2">{thaiStatus(o.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div></div>
    </div>
  );
}

function thaiStatus(s: Order['status']) {
  switch (s) {
    case 'pending': return 'รออนุมัติ';
    case 'approved': return 'อนุมัติแล้ว';
    case 'rejected': return 'ไม่อนุมัติ';
    case 'in_progress': return 'กำลังดำเนินการ';
    case 'delivered': return 'ได้รับแล้ว';
    default: return s;
  }
}
