import React, { useEffect, useState } from 'react';
import { subscribeAuthAndRole } from '../../lib/auth';
import { db } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { ChevronDown, ChevronRight, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

/** ---------- Constants ---------- */
const ITEM_CATEGORIES = ['วัตถุดิบ', 'เครื่องมือ', 'วัสดุสิ้นเปลือง', 'Software'] as const;

// สถานะต่อ "รายการสินค้า"
const ITEM_STATUS_G1 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ', 'สินค้าเข้าคลัง'] as const; // วัตถุดิบ
const ITEM_STATUS_G2 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ'] as const;                   // กลุ่มอื่น

const getItemStatusOptions = (category?: string) =>
  category === 'วัตถุดิบ' ? ITEM_STATUS_G1 : ITEM_STATUS_G2;

const getItemCategoryColor = (category: string) => {
  switch (category) {
    case 'วัตถุดิบ': return 'bg-green-100 text-green-800 border-green-200';
    case 'เครื่องมือ': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'วัสดุสิ้นเปลือง': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Software': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getItemStatusColor = (status: string) => {
  switch (status) {
    case 'จัดซื้อ': return 'bg-yellow-100 text-yellow-800';
    case 'ของมาส่ง': return 'bg-blue-100 text-blue-800';
    case 'ส่งมอบของ': return 'bg-purple-100 text-purple-800';
    case 'สินค้าเข้าคลัง': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

type Order = {
  id: string;
  orderNo?: number;
  date?: string;
  requester?: string;
  requesterName?: string;
  totalAmount?: number;
  total?: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';
  createdAt?: any;
  items?: Array<{
    description?: string;
    quantity?: number;
    amount?: number;
    lineTotal?: number;
    category?: string;
    itemStatus?: string;
  }>;
  itemsCategories?: Record<number, string>;
  itemsStatuses?: Record<number, string>;
};

/** ---------- Page Component ---------- */
export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<'buyer'|'supervisor'|'procurement'|null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string>('');
  const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});

  /** Role detection with robust fallbacks */
  useEffect(() => {
    let unsubOrders: (() => void) | null = null;

    const off = subscribeAuthAndRole(async (authUser, r) => {
      if (!authUser) {
        window.location.href = '/login';
        return;
      }
      setUser(authUser);

      let effectiveRole = r as any;

      if (!effectiveRole) {
        effectiveRole =
          (localStorage.getItem('role') as any) ||
          (localStorage.getItem('appRole') as any) ||
          null;
      }

      if (!effectiveRole) {
        try {
          const uref = doc(db, 'users', authUser.uid);
          const usnap = await getDoc(uref);
          if (usnap.exists()) {
            effectiveRole = (usnap.data() as any)?.role || null;
          }
        } catch (e) {
          console.warn('fetch role fallback error', e);
        }
      }

      setRole(effectiveRole || null);

      if (unsubOrders) unsubOrders();
      const qRef = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubOrders = onSnapshot(
        qRef,
        (snap) => {
          const list = snap.docs.map((d) => ({ 
            id: d.id, 
            ...(d.data() as any) 
          })) as Order[];
          
          setOrders(list);
          setErr('');
          setLoading(false);
        },
        (e) => {
          console.error('orders read error:', e);
          setErr(e?.message || String(e));
          setLoading(false);
        }
      );
    });

    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setErr('การโหลดข้อมูลใช้เวลานานเกินไป');
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
      if (unsubOrders) unsubOrders();
      off();
    };
  }, [loading]);

  const toggleExpand = (orderId: string) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const fmt = (ts: any) =>
    ts?.toDate
      ? ts.toDate().toLocaleString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const thaiStatus = (s: Order['status']) => {
    switch (s) {
      case 'pending': return 'รออนุมัติ';
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ไม่อนุมัติ';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'delivered': return 'ได้รับแล้ว';
      default: return s as string;
    }
  };

  const getStatusColor = (s: Order['status']) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // แสดงข้อความสำเร็จ
  const showSuccessMessage = (orderItemKey: string, message: string) => {
    setSuccessMessages(prev => ({ ...prev, [orderItemKey]: message }));
    setTimeout(() => {
      setSuccessMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[orderItemKey];
        return newMessages;
      });
    }, 3000);
  };

  const handleSetItemCategory = async (order: Order, itemIndex: number, category: string) => {
    const orderItemKey = `${order.id}-${itemIndex}-category`;
    
    console.log('Category change:', { orderId: order.id, itemIndex, category });

    if (!order?.id || processingOrders.has(order.id)) {
      return;
    }

    if (!category || category === '') {
      console.log('Empty category selected, skipping');
      return;
    }
    
    const ref = doc(db, 'orders', order.id);
    
    try {
      setProcessingOrders((prev) => new Set(prev).add(order.id));
      
      if (role !== 'procurement') {
        throw new Error(`ไม่มีสิทธิ์ในการอัปเดต: Role ปัจจุบันคือ ${role} แต่ต้องเป็น procurement`);
      }

      if (!user?.uid) {
        throw new Error('ยังไม่ได้ล็อกอิน กรุณาล็อกอินใหม่');
      }
      
      // อัปเดตข้อมูล
      const currentItems = order.items || [];
      const updatedItems = currentItems.map((item, idx) => 
        idx === itemIndex ? { ...item, category } : item
      );
      
      const existingMap = order.itemsCategories || {};
      const updatedMap = { ...existingMap, [itemIndex]: category };

      await updateDoc(ref, {
        items: updatedItems,
        itemsCategories: updatedMap,
        updatedAt: serverTimestamp(),
      });
      
      console.log('Category updated successfully');
      showSuccessMessage(orderItemKey, `บันทึกประเภท "${category}" เรียบร้อย`);
      
    } catch (e: any) {
      console.error('Error updating category:', e);
      let errorMessage = `เกิดข้อผิดพลาดในการอัปเดตประเภทสินค้า: ${e?.message || 'ไม่ทราบสาเหตุ'}`;
      
      if (e?.code === 'permission-denied') {
        errorMessage = `ไม่มีสิทธิ์ในการแก้ไข กรุณาตรวจสอบว่าคุณเป็น "ฝ่ายจัดซื้อ" หรือไม่`;
      }
      
      alert(errorMessage);
    } finally {
      setProcessingOrders((prev) => {
        const s = new Set(prev);
        s.delete(order.id);
        return s;
      });
    }
  };

  const handleSetItemStatus = async (order: Order, itemIndex: number, itemStatus: string) => {
    const orderItemKey = `${order.id}-${itemIndex}-status`;
    
    console.log('Status change:', { orderId: order.id, itemIndex, itemStatus });

    if (!order?.id || processingOrders.has(order.id)) {
      return;
    }

    if (!itemStatus || itemStatus === '') {
      console.log('Empty status selected, skipping');
      return;
    }
    
    const ref = doc(db, 'orders', order.id);
    
    try {
      setProcessingOrders((prev) => new Set(prev).add(order.id));
      
      if (role !== 'procurement') {
        throw new Error(`ไม่มีสิทธิ์ในการอัปเดต: Role ปัจจุบันคือ ${role} แต่ต้องเป็น procurement`);
      }

      if (!user?.uid) {
        throw new Error('ยังไม่ได้ล็อกอิน กรุณาล็อกอินใหม่');
      }
      
      // อัปเดตข้อมูล
      const currentItems = order.items || [];
      const updatedItems = currentItems.map((item, idx) => 
        idx === itemIndex ? { ...item, itemStatus } : item
      );
      
      const existingMap = order.itemsStatuses || {};
      const updatedMap = { ...existingMap, [itemIndex]: itemStatus };

      await updateDoc(ref, {
        items: updatedItems,
        itemsStatuses: updatedMap,
        updatedAt: serverTimestamp(),
      });
      
      console.log('Status updated successfully');
      showSuccessMessage(orderItemKey, `บันทึกสถานะ "${itemStatus}" เรียบร้อย`);
      
    } catch (e: any) {
      console.error('Error updating status:', e);
      let errorMessage = `เกิดข้อผิดพลาดในการอัปเดตสถานะรายการ: ${e?.message || 'ไม่ทราบสาเหตุ'}`;
      
      if (e?.code === 'permission-denied') {
        errorMessage = `ไม่มีสิทธิ์ในการแก้ไข กรุณาตรวจสอบว่าคุณเป็น "ฝ่ายจัดซื้อ" หรือไม่`;
      }
      
      alert(errorMessage);
    } finally {
      setProcessingOrders((prev) => {
        const s = new Set(prev);
        s.delete(order.id);
        return s;
      });
    }
  };

  /** ---------- Render ---------- */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg" />
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="alert alert-error mb-4">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">ไม่สามารถโหลดข้อมูลได้</h3>
            <div className="text-sm">{err}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-sm mt-2"
            >
              รีโหลดหน้า
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">รายการใบสั่งซื้อ</h2>
              <p className="text-sm text-gray-600 mt-1">
                {role === 'supervisor'
                  ? 'สำหรับหัวหน้างาน - อนุมัติใบสั่งซื้อ'
                  : role === 'procurement'
                  ? 'สำหรับฝ่ายจัดซื้อ - จัดการประเภทสินค้าและสถานะ'
                  : 'ตรวจสอบบทบาทไม่สำเร็จ (แสดงแบบอ่านอย่างเดียว)'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium w-24">เลขที่</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">ผู้ขอ</th>
                  <th className="px-4 py-3 text-right font-medium">ยอดรวม</th>
                  <th className="px-4 py-3 font-medium">สถานะใบ</th>
                  <th className="px-4 py-3 font-medium w-20">รายการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {orders.map((o) => {
                  const isOpen = !!expanded[o.id];
                  const orderNumber = o.orderNo ?? 0;
                  const orderDate = o.date || fmt(o.createdAt);
                  const requesterName = o.requester || o.requesterName || '-';
                  const totalAmount = (o.totalAmount ?? o.total ?? 0);
                  const itemsCount = o.items?.length || 0;

                  return (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          #{orderNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{orderDate}</td>
                        <td className="px-4 py-3 text-gray-900">{requesterName}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                          {totalAmount.toLocaleString('th-TH')} บาท
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                            {thaiStatus(o.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            onClick={() => toggleExpand(o.id)}
                            title={isOpen ? 'ซ่อนรายการ' : 'แสดงรายการ'}
                          >
                            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {itemsCount}
                          </button>
                        </td>
                      </tr>

                      {/* แถวรายการสินค้า */}
                      {isOpen && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={6} className="px-6 pb-5 pt-2">
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">
                                    รายการสินค้า ({itemsCount} รายการ)
                                  </span>
                                </div>
                              </div>
                              
                              {itemsCount > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                      <tr className="text-left text-slate-600">
                                        <th className="px-4 py-3 font-medium w-12">#</th>
                                        <th className="px-4 py-3 font-medium">รายการ</th>
                                        <th className="px-4 py-3 font-medium w-20 text-right">จำนวน</th>
                                        <th className="px-4 py-3 font-medium w-24 text-right">ราคา/หน่วย</th>
                                        <th className="px-4 py-3 font-medium w-24 text-right">รวม</th>
                                        <th className="px-4 py-3 font-medium w-40">ประเภทสินค้า</th>
                                        <th className="px-4 py-3 font-medium w-40">สถานะรายการ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {(o.items || []).map((item, idx) => {
                                        const catMap = o.itemsCategories || {};
                                        const statusMap = o.itemsStatuses || {};
                                        const category = item?.category ?? catMap[idx] ?? '';
                                        const itemStatus = item?.itemStatus ?? statusMap[idx] ?? '';
                                        const isProcessing = processingOrders.has(o.id);
                                        const categoryKey = `${o.id}-${idx}-category`;
                                        const statusKey = `${o.id}-${idx}-status`;

                                        return (
                                          <tr key={idx} className="align-top hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-700 font-medium">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                              <div className="text-gray-900 font-medium">{item?.description || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">{item?.quantity ?? '-'}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                              {item?.amount != null ? Number(item.amount).toLocaleString('th-TH') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                              {item?.lineTotal != null ? Number(item.lineTotal).toLocaleString('th-TH') : '-'}
                                            </td>

                                            {/* ประเภทสินค้า */}
                                            <td className="px-4 py-3">
                                              {role === 'procurement' ? (
                                                <div className="space-y-2">
                                                  <select
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    value={category}
                                                    onChange={(e) => handleSetItemCategory(o, idx, e.target.value)}
                                                    disabled={isProcessing}
                                                  >
                                                    <option value="">เลือกประเภท...</option>
                                                    {ITEM_CATEGORIES.map(c => (
                                                      <option key={c} value={c}>{c}</option>
                                                    ))}
                                                  </select>
                                                  
                                                  {category && (
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getItemCategoryColor(category)}`}>
                                                      {category}
                                                    </span>
                                                  )}
                                                  
                                                  {isProcessing && (
                                                    <div className="text-xs text-blue-600 flex items-center gap-1">
                                                      <Clock className="w-3 h-3 animate-spin" />
                                                      กำลังบันทึก...
                                                    </div>
                                                  )}
                                                  
                                                  {successMessages[categoryKey] && (
                                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                                      <CheckCircle className="w-3 h-3" />
                                                      {successMessages[categoryKey]}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div>
                                                  {category ? (
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getItemCategoryColor(category)}`}>
                                                      {category}
                                                    </span>
                                                  ) : (
                                                    <span className="text-gray-500 text-xs">-</span>
                                                  )}
                                                </div>
                                              )}
                                            </td>

                                            {/* สถานะรายการ */}
                                            <td className="px-4 py-3">
                                              {role === 'procurement' ? (
                                                <div className="space-y-2">
                                                  <select
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    value={itemStatus}
                                                    onChange={(e) => handleSetItemStatus(o, idx, e.target.value)}
                                                    disabled={isProcessing || !category}
                                                  >
                                                    <option value="">เลือกสถานะ...</option>
                                                    {getItemStatusOptions(category).map(s => (
                                                      <option key={s} value={s}>{s}</option>
                                                    ))}
                                                  </select>
                                                  
                                                  {itemStatus && (
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(itemStatus)}`}>
                                                      {itemStatus}
                                                    </span>
                                                  )}
                                                  
                                                  {!category && (
                                                    <p className="text-xs text-yellow-600">กรุณาเลือกประเภทก่อน</p>
                                                  )}
                                                  
                                                  {isProcessing && (
                                                    <div className="text-xs text-blue-600 flex items-center gap-1">
                                                      <Clock className="w-3 h-3 animate-spin" />
                                                      กำลังบันทึก...
                                                    </div>
                                                  )}
                                                  
                                                  {successMessages[statusKey] && (
                                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                                      <CheckCircle className="w-3 h-3" />
                                                      {successMessages[statusKey]}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div>
                                                  {itemStatus ? (
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(itemStatus)}`}>
                                                      {itemStatus}
                                                    </span>
                                                  ) : (
                                                    <span className="text-gray-500 text-xs">-</span>
                                                  )}
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-8 text-center text-gray-500">
                                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-sm">ไม่มีรายการสินค้า</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีใบสั่งซื้อ</p>
                <p className="text-sm text-gray-600">ใบสั่งซื้อจะแสดงที่นี่เมื่อมีการสร้าง</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}