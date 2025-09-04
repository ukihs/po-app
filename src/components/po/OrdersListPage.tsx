import React, { useEffect, useState } from 'react';
import { type Order } from '../../lib/poApi';
import { subscribeAuthAndRole } from '../../lib/auth';
import { db } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDoc,
  query,
} from 'firebase/firestore';
import { ChevronDown, ChevronRight } from 'lucide-react';

/** ---------- Constants ---------- */
const ITEM_CATEGORIES = ['วัตถุดิบ', 'Software', 'เครื่องมือ', 'วัสดุสิ้นเปลือง'] as const;

// สถานะต่อ “รายการสินค้า”
const ITEM_STATUS_G1 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ', 'สินค้าเข้าคลัง'] as const; // วัตถุดิบ
const ITEM_STATUS_G2 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ'] as const;                   // กลุ่มอื่น
const getItemStatusOptions = (category?: string) =>
  category === 'วัตถุดิบ' ? ITEM_STATUS_G1 : ITEM_STATUS_G2;

/** ---------- Page Component ---------- */
export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<'buyer'|'supervisor'|'procurement'|null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string>('');

  /** Role detection with robust fallbacks */
  useEffect(() => {
    let unsubOrders: (() => void) | null = null;

    const off = subscribeAuthAndRole(async (authUser, r) => {
      if (!authUser) {
        window.location.href = '/login';
        return;
      }
      setUser(authUser);

      // 1) role จาก auth listener
      let effectiveRole = r as any;

      // 2) fallback จาก localStorage
      if (!effectiveRole) {
        effectiveRole =
          (localStorage.getItem('role') as any) ||
          (localStorage.getItem('appRole') as any) ||
          null;
      }

      // 3) fallback จากเอกสาร users/<uid>
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

      // subscribe orders พร้อม error callback
      if (unsubOrders) unsubOrders();
      const qRef = query(collection(db, 'orders'));
      unsubOrders = onSnapshot(
        qRef,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Order[];
          // เรียงใหม่สุดก่อนถ้ามี createdAt
          list.sort((a: any, b: any) => {
            const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb - ta;
          });
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

    // Hard stop loading
    const t = setTimeout(() => setLoading(false), 5000);

    return () => {
      clearTimeout(t);
      if (unsubOrders) unsubOrders();
      off();
    };
  }, []);

  const toggleExpand = (orderId: string) =>
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));

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

  const thaiStatus = (s: Order['status']) =>
    s === 'pending' ? 'รออนุมัติ'
    : s === 'approved' ? 'อนุมัติแล้ว'
    : s === 'rejected' ? 'ไม่อนุมัติ'
    : s === 'in_progress' ? 'กำลังดำเนินการ'
    : s === 'delivered' ? 'ได้รับแล้ว'
    : (s as string);

  const getStatusColor = (s: Order['status']) =>
    s === 'pending' ? 'bg-yellow-100 text-yellow-800'
    : s === 'approved' ? 'bg-green-100 text-green-800'
    : s === 'rejected' ? 'bg-red-100 text-red-800'
    : s === 'in_progress' ? 'bg-blue-100 text-blue-800'
    : s === 'delivered' ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';

  // ตั้ง “ประเภทสินค้า” ต่อรายการ
  const handleSetItemCategory = async (order: any, itemIndex: number, category: (typeof ITEM_CATEGORIES)[number]) => {
    const ref = doc(db, 'orders', order.id);
    try {
      setProcessingOrders((prev) => new Set(prev).add(order.id));
      // Plan A: อัปเดตลง array path
      await updateDoc(ref, { [`items.${itemIndex}.category`]: category as any, updatedAt: serverTimestamp() });
    } catch (e: any) {
      // Plan B: ใช้ map สำรอง itemsCategories
      const existingMap = (order as any).itemsCategories || {};
      await setDoc(ref, { itemsCategories: { ...existingMap, [itemIndex]: category }, updatedAt: serverTimestamp() }, { merge: true });
    } finally {
      setProcessingOrders((prev) => {
        const s = new Set(prev);
        s.delete(order.id);
        return s;
      });
    }
  };

  // ตั้ง “สถานะของรายการสินค้า”
  const handleSetItemStatus = async (
    order: any,
    itemIndex: number,
    itemStatus: (typeof ITEM_STATUS_G1 | typeof ITEM_STATUS_G2)[number]
  ) => {
    const ref = doc(db, 'orders', order.id);
    try {
      setProcessingOrders((prev) => new Set(prev).add(order.id));
      // Plan A: อัปเดตลง array path
      await updateDoc(ref, { [`items.${itemIndex}.itemStatus`]: itemStatus as any, updatedAt: serverTimestamp() });
    } catch (e: any) {
      // Plan B: map สำรอง itemsStatuses
      const existingMap = (order as any).itemsStatuses || {};
      await setDoc(ref, { itemsStatuses: { ...existingMap, [itemIndex]: itemStatus }, updatedAt: serverTimestamp() }, { merge: true });
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {err && (
        <div className="alert alert-error mb-4 text-sm">
          <span>ไม่สามารถอ่านข้อมูลได้: {err}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">รายการใบสั่งซื้อ</h2>
              <p className="text-sm text-gray-600 mt-1">
                {role === 'supervisor'
                  ? 'สำหรับหัวหน้างาน - อนุมัติใบสั่งซื้อ'
                  : role === 'procurement'
                  ? 'สำหรับฝ่ายจัดซื้อ - จัดประเภทสินค้า & สถานะต่อรายการ'
                  : 'ยังตรวจสอบบทบาทไม่สำเร็จ (แสดงแบบอ่านอย่างเดียว)'}
              </p>
            </div>
            <div className="text-xs text-gray-500 bg-slate-50 border rounded px-2 py-1">
              User: {user?.email || user?.uid} | Role: {role || 'unknown'} | Orders: {orders.length}
            </div>
          </div>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">ผู้ขอ</th>
                  <th className="px-4 py-3 text-right font-medium">ยอดรวม</th>
                  <th className="px-4 py-3 font-medium">สถานะใบ</th>
                  {/* เอาคอลัมน์ “จัดการ” ออกตามที่ขอ */}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {orders.map((o: any) => {
                  const isOpen = !!expanded[o.id];
                  return (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:underline"
                            onClick={() => toggleExpand(o.id)}
                            title={isOpen ? 'ซ่อนรายการ' : 'แสดงรายการ'}
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            #{o.orderNo ?? '-'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{o.date || fmt(o.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-900">{o.requester || o.requesterName || '-'}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                          {(o.totalAmount ?? o.total ?? 0).toLocaleString('th-TH')} บาท
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                            {thaiStatus(o.status)}
                          </span>
                        </td>
                      </tr>

                      {/* แถวรายการสินค้า */}
                      {isOpen && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={5} className="px-6 pb-5">
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                              <div className="px-4 py-3 text-sm font-medium text-gray-700">รายการสินค้า</div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50">
                                    <tr className="text-left text-slate-600">
                                      <th className="px-4 py-2 font-medium">#</th>
                                      <th className="px-4 py-2 font-medium">รายการ</th>
                                      <th className="px-4 py-2 font-medium">จำนวน</th>
                                      <th className="px-4 py-2 font-medium">ราคา/หน่วย</th>
                                      <th className="px-4 py-2 font-medium">รวม</th>
                                      <th className="px-4 py-2 font-medium w-[220px]">ประเภทสินค้า</th>
                                      <th className="px-4 py-2 font-medium w-[220px]">สถานะรายการ</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {(o.items || []).map((it: any, idx: number) => {
                                      const catMap = (o as any).itemsCategories || {};
                                      const statusMap = (o as any).itemsStatuses || {};
                                      const category = it?.category ?? catMap[idx] ?? '';
                                      const itemStatus = it?.itemStatus ?? statusMap[idx] ?? '';

                                      return (
                                        <tr key={idx} className="align-top">
                                          <td className="px-4 py-2 text-gray-700">{idx + 1}</td>
                                          <td className="px-4 py-2 text-gray-900">{it?.description || '-'}</td>
                                          <td className="px-4 py-2 text-gray-700">{it?.quantity ?? '-'}</td>
                                          <td className="px-4 py-2 text-gray-700">
                                            {it?.amount != null ? Number(it.amount).toLocaleString('th-TH') : '-'}
                                          </td>
                                          <td className="px-4 py-2 text-gray-900 font-medium">
                                            {it?.lineTotal != null ? Number(it.lineTotal).toLocaleString('th-TH') : '-'}
                                          </td>

                                          {/* ประเภทสินค้า */}
                                          <td className="px-4 py-2">
                                            {role === 'procurement' ? (
                                              <select
                                                className="select select-sm select-bordered rounded-lg w-full"
                                                value={category}
                                                onChange={(e) => handleSetItemCategory(o, idx, e.target.value as any)}
                                                disabled={processingOrders.has(o.id)}
                                              >
                                                <option value="" disabled>เลือกประเภท…</option>
                                                {ITEM_CATEGORIES.map(c => (
                                                  <option key={c} value={c}>{c}</option>
                                                ))}
                                              </select>
                                            ) : (
                                              <span className="text-gray-600">{category || '-'}</span>
                                            )}
                                          </td>

                                          {/* สถานะรายการ */}
                                          <td className="px-4 py-2">
                                            {role === 'procurement' ? (
                                              <select
                                                className="select select-sm select-bordered rounded-lg w-full"
                                                value={itemStatus}
                                                onChange={(e) => handleSetItemStatus(o, idx, e.target.value as any)}
                                                disabled={processingOrders.has(o.id)}
                                              >
                                                <option value="" disabled>เลือกสถานะ…</option>
                                                {getItemStatusOptions(category).map(s => (
                                                  <option key={s} value={s}>{s}</option>
                                                ))}
                                              </select>
                                            ) : (
                                              <span className="text-gray-600">{itemStatus || '-'}</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
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
                <p className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีใบสั่งซื้อ</p>
                <p className="text-sm text-gray-600">สร้างใบแรกจากเมนู “คำสั่งซื้อ”</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
