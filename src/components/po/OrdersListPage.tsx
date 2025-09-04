import React, { useEffect, useState } from 'react';
import { approveOrder, listenOrdersAll, setOrderStatus, type Order } from '../../lib/poApi';
import { subscribeAuthAndRole } from '../../lib/auth';

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<'buyer'|'supervisor'|'procurement'|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let offOrders: (()=>void)|null = null;
    const off = subscribeAuthAndRole((user, r) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      
      setRole(r);
      setLoading(false);
      
      // Only allow supervisor and procurement to access this page
      if (r === 'buyer') {
        window.location.href = '/orders/create';
        return;
      }
      
      if (r === 'supervisor' || r === 'procurement') {
        if (offOrders) offOrders();
        offOrders = listenOrdersAll(setOrders);
      }
    });
    return () => { 
      if (offOrders) offOrders(); 
      off(); 
    };
  }, []);

  const handleApproval = async (orderId: string, approved: boolean) => {
    try {
      await approveOrder(orderId, approved);
    } catch (error) {
      console.error('Error approving order:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      await setOrderStatus(orderId, status);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  if (loading) return <div className="container-nice py-6">กำลังโหลด...</div>;
  if (!role || role === 'buyer') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">รายการใบสั่งซื้อ</h2>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">เลขที่</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">ผู้ขอ</th>
                  <th className="px-4 py-3 text-right font-medium">ยอดรวม</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 w-64 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">#{o.orderNo}</td>
                    <td className="px-4 py-3 text-gray-600">{o.date}</td>
                    <td className="px-4 py-3 text-gray-900">{o.requester}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                      {o.totalAmount?.toLocaleString('th-TH') ?? 0} บาท
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                        {thaiStatus(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {role === 'supervisor' && o.status === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-sm rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200"
                            style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                            onClick={() => handleApproval(o.id, true)}
                          >
                            อนุมัติ
                          </button>
                          <button 
                            className="btn btn-sm rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200"
                            style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                            onClick={() => handleApproval(o.id, false)}
                          >
                            ไม่อนุมัติ
                          </button>
                        </div>
                      )}
                      {role === 'procurement' && (o.status === 'approved' || o.status === 'in_progress') && (
                        <div className="flex items-center gap-2">
                          <select 
                            className="select select-sm select-bordered rounded-xl min-w-0" 
                            defaultValue={o.status} 
                            onChange={e => handleStatusChange(o.id, e.target.value as Order['status'])}
                          >
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="in_progress">กำลังดำเนินการ</option>
                            <option value="delivered">ได้รับแล้ว</option>
                          </select>
                        </div>
                      )}
                      {(role === 'supervisor' && o.status !== 'pending') || 
                       (role === 'procurement' && o.status !== 'approved' && o.status !== 'in_progress') ? (
                        <span className="text-gray-400 text-sm">-</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-4.5B4.875 8.25 4.5 8.625 4.5 12v2.625m15 0a3.375 3.375 0 0 1-3.375 3.375h-4.5a3.375 3.375 0 0 1-3.375-3.375m15 0V17a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-.75m15 0V16a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25V16" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีใบสั่งซื้อ</p>
                <p className="text-sm text-gray-600">รอใบสั่งซื้อจากผู้ใช้งาน</p>
              </div>
            )}
          </div>
        </div>
      </div>
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

function getStatusColor(status: Order['status']) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}