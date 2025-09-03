import React, { useEffect, useState } from 'react';
import { approveOrder, listenOrdersAll, setOrderStatus, type Order } from '../../lib/poApi';
import { subscribeAuthAndRole } from '../../lib/auth';

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<'buyer'|'supervisor'|'procurement'|null>(null);

  useEffect(() => {
    let offOrders: (()=>void)|null = null;
    const off = subscribeAuthAndRole((user, r) => {
      if (!user || !r) return;
      setRole(r);
      if (offOrders) offOrders();
      offOrders = listenOrdersAll(setOrders);
      if (r === 'buyer') window.location.href = '/orders/create'; // กันเข้ามาผิดบทบาท
    });
    return () => { if (offOrders) offOrders(); off(); };
  }, []);

  if (!role) return null;

  return (
    <div className="container-nice page-narrow py-8">
      <div className="card"><div className="card-pad">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">รายการใบสั่งซื้อ</h2>

        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2">เลขที่</th>
                <th className="px-3 py-2">วันที่</th>
                <th className="px-3 py-2">ผู้ขอ</th>
                <th className="px-3 py-2 text-right">ยอดรวม</th>
                <th className="px-3 py-2">สถานะ</th>
                <th className="px-3 py-2 w-64">จัดการ</th>
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
                  <td className="px-3 py-2">
                    {role === 'supervisor' && o.status === 'pending' && (
                      <div className="flex gap-2">
                        <button className="btn btn-green btn-sm" onClick={()=>approveOrder(o.id, true)}>อนุมัติ</button>
                        <button className="btn btn-red btn-sm" onClick={()=>approveOrder(o.id, false)}>ไม่อนุมัติ</button>
                      </div>
                    )}
                    {role === 'procurement' && (o.status === 'approved' || o.status === 'in_progress') && (
                      <div className="flex items-center gap-2">
                        <select className="input" defaultValue={o.status} onChange={e=>setOrderStatus(o.id, e.target.value as any)}>
                          <option value="approved">อนุมัติแล้ว</option>
                          <option value="in_progress">กำลังดำเนินการ</option>
                          <option value="delivered">ได้รับแล้ว</option>
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={e=>setOrderStatus(o.id, (e.currentTarget.previousSibling as HTMLSelectElement).value as any)}>
                          อัปเดต
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
