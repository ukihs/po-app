import React, { useEffect, useState } from 'react';
import { approveOrder, listenOrdersAll, setProcurementStatus, type Order, type ProcurementStatus, getProcurementStatusDisplay, getItemCategory, type ItemType } from '../../lib/poApi';
import { subscribeAuthAndRole } from '../../lib/auth';
import { Eye, Package, Truck, CheckCircle, Filter } from 'lucide-react';
import OrderDetailsModal from './OrderDetailsModal';

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<'buyer'|'supervisor'|'procurement'|null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | ItemType>('all');

  useEffect(() => {
    let offOrders: (()=>void)|null = null;
    const off = subscribeAuthAndRole((authUser, r) => {
      if (!authUser) {
        window.location.href = '/login';
        return;
      }
      
      setUser(authUser);
      setRole(r);
      setLoading(false);
      
      // Redirect buyer to create page
      if (r === 'buyer') {
        window.location.href = '/orders/create';
        return;
      }
      
      // Load orders for supervisor and procurement
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
    const action = approved ? 'อนุมัติ' : 'ไม่อนุมัติ';
    if (!confirm(`คุณต้องการ${action}ใบสั่งซื้อนี้หรือไม่?`)) {
      return;
    }

    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      await approveOrder(orderId, approved);
      alert(`${action}ใบสั่งซื้อเรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error approving order:', error);
      alert(`เกิดข้อผิดพลาดในการ${action}: ` + (error as any)?.message);
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleProcurementStatusChange = async (orderId: string, newStatus: ProcurementStatus) => {
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      await setProcurementStatus(orderId, newStatus);
    } catch (error) {
      console.error('Error updating procurement status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getProcurementStatusOptions = (currentStatus: ProcurementStatus | undefined, itemType: string) => {
    const category = getItemCategory(itemType as any);
    
    if (category === 'raw_material') {
      return [
        { value: 'จัดซื้อ', label: 'จัดซื้อ' },
        { value: 'ของมาส่ง', label: 'ของมาส่ง' },
        { value: 'ส่งมอบของ', label: 'ส่งมอบของ' },
        { value: 'คลังสินค้า', label: 'คลังสินค้า' },
      ];
    } else {
      return [
        { value: 'จัดซื้อ_2', label: 'จัดซื้อ' },
        { value: 'ของมาส่ง_2', label: 'ของมาส่ง' },
        { value: 'ส่งมอบของ_2', label: 'ส่งมอบของ' },
      ];
    }
  };

  const getItemTypeColor = (itemType: string) => {
    switch (itemType) {
      case 'วัตถุดิบ': return 'bg-green-100 text-green-800';
      case 'เครื่องมือ': return 'bg-blue-100 text-blue-800';
      case 'วัสดุสิ้นเปลือง': return 'bg-orange-100 text-orange-800';
      case 'Software': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter orders by item type for procurement
  const filteredOrders = role === 'procurement' && itemTypeFilter !== 'all' 
    ? orders.filter(order => 
        order.items?.some(item => item.itemType === itemTypeFilter)
      )
    : orders;

  const itemTypeOptions = [
    { value: 'all', label: 'ทั้งหมด', count: orders.length },
    { value: 'วัตถุดิบ', label: 'วัตถุดิบ', count: orders.filter(o => o.items?.some(i => i.itemType === 'วัตถุดิบ')).length },
    { value: 'เครื่องมือ', label: 'เครื่องมือ', count: orders.filter(o => o.items?.some(i => i.itemType === 'เครื่องมือ')).length },
    { value: 'วัสดุสิ้นเปลือง', label: 'วัสดุสิ้นเปลือง', count: orders.filter(o => o.items?.some(i => i.itemType === 'วัสดุสิ้นเปลือง')).length },
    { value: 'Software', label: 'Software', count: orders.filter(o => o.items?.some(i => i.itemType === 'Software')).length },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!role || role === 'buyer') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">รายการใบสั่งซื้อ</h2>
              <p className="text-sm text-gray-600 mt-1">
                {role === 'supervisor' ? 'สำหรับหัวหน้างาน - อนุมัติใบสั่งซื้อ' : 
                 role === 'procurement' ? 'สำหรับฝ่ายจัดซื้อ - จัดการสถานะการสั่งซื้อ' : ''}
              </p>
            </div>
            
            <div className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded">
              Orders: {filteredOrders.length}/{orders.length}
            </div>
          </div>

          {/* Item Type Filter สำหรับ Procurement */}
          {role === 'procurement' && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">กรองตามประเภทสินค้า:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {itemTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setItemTypeFilter(option.value as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      itemTypeFilter === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">เลขที่</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">ผู้ขอ</th>
                  {role === 'procurement' && (
                    <th className="px-4 py-3 font-medium">ประเภทหลัก</th>
                  )}
                  <th className="px-4 py-3 text-right font-medium">ยอดรวม</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 w-64 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map(o => {
                  const primaryItemType = o.items?.[0]?.itemType || 'วัตถุดิบ';
                  const itemTypes = [...new Set(o.items?.map(item => item.itemType))];
                  
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">#{o.orderNo}</div>
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{o.date}</td>
                      <td className="px-4 py-3 text-gray-900">{o.requester}</td>
                      
                      {/* แสดงประเภทสินค้าเฉพาะสำหรับ procurement */}
                      {role === 'procurement' && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getItemTypeColor(primaryItemType)}`}>
                              {primaryItemType}
                            </span>
                            {itemTypes.length > 1 && (
                              <span className="text-xs text-gray-500">
                                +{itemTypes.length - 1} ประเภท
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                        {o.totalAmount?.toLocaleString('th-TH') ?? 0} บาท
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                            {thaiStatus(o.status)}
                          </span>
                          {o.procurementStatus && (
                            <div className="text-xs text-blue-600">
                              {getProcurementStatusDisplay(o.procurementStatus)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {/* Supervisor Actions */}
                        {role === 'supervisor' && o.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              className="btn btn-sm rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                              style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                              onClick={() => handleApproval(o.id, true)}
                              disabled={processingOrders.has(o.id)}
                            >
                              {processingOrders.has(o.id) ? (
                                <span className="loading loading-spinner loading-xs mr-1"></span>
                              ) : null}
                              อนุมัติ
                            </button>
                            <button 
                              className="btn btn-sm rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                              style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                              onClick={() => handleApproval(o.id, false)}
                              disabled={processingOrders.has(o.id)}
                            >
                              {processingOrders.has(o.id) ? (
                                <span className="loading loading-spinner loading-xs mr-1"></span>
                              ) : null}
                              ไม่อนุมัติ
                            </button>
                          </div>
                        )}

                        {/* Procurement Actions */}
                        {role === 'procurement' && o.status === 'approved' && o.procurementStatus && (
                          <div className="flex items-center gap-2">
                            <select 
                              className="select select-sm select-bordered rounded-xl min-w-0 text-sm"
                              value={o.procurementStatus} 
                              onChange={e => handleProcurementStatusChange(o.id, e.target.value as ProcurementStatus)}
                              disabled={processingOrders.has(o.id)}
                            >
                              {getProcurementStatusOptions(o.procurementStatus, primaryItemType).map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {processingOrders.has(o.id) && (
                              <span className="loading loading-spinner loading-xs"></span>
                            )}
                          </div>
                        )}

                        {/* Status display for non-actionable items */}
                        {((role === 'supervisor' && o.status !== 'pending') || 
                          (role === 'procurement' && o.status !== 'approved')) && (
                          <div className="text-center">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {o.status === 'rejected' ? 'ไม่อนุมัติ' :
                               o.status === 'delivered' ? 'เสร็จสิ้น' :
                               o.status === 'pending' ? 'รออนุมัติ' :
                               thaiStatus(o.status)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-4.5B4.875 8.25 4.5 8.625 4.5 12v2.625m15 0a3.375 3.375 0 0 1-3.375 3.375h-4.5a3.375 3.375 0 0 1-3.375-3.375m15 0V17a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-.75m15 0V16a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25V16" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">
                  {itemTypeFilter !== 'all' ? `ไม่มีใบสั่งซื้อประเภท ${itemTypeFilter}` : 'ยังไม่มีใบสั่งซื้อ'}
                </p>
                <p className="text-sm text-gray-600">
                  {role === 'supervisor' ? 'รอใบสั่งซื้อจากผู้ใช้งานเพื่ออนุมัติ' : 'รอใบสั่งซื้อที่ได้รับการอนุมัติ'}
                </p>
              </div>
            )}
          </div>

          {/* Statistics Summary */}
          {filteredOrders.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-800">
                  {filteredOrders.filter(o => o.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-600">รออนุมัติ</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-800">
                  {filteredOrders.filter(o => o.status === 'approved').length}
                </div>
                <div className="text-sm text-green-600">อนุมัติแล้ว</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {filteredOrders.filter(o => o.status === 'in_progress' || o.procurementStatus).length}
                </div>
                <div className="text-sm text-blue-600">กำลังดำเนินการ</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-800">
                  {filteredOrders.filter(o => o.status === 'delivered').length}
                </div>
                <div className="text-sm text-purple-600">ได้รับแล้ว</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal 
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
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