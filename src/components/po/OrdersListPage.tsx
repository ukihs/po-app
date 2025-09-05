import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { subscribeAuthAndRole } from '../../lib/auth';
import { ChevronDown, ChevronRight } from 'lucide-react';

/** ---------- Types ---------- */
type Role = 'buyer' | 'supervisor' | 'procurement' | null;
type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

type OrderItem = {
  description?: string;
  quantity?: number;
  amount?: number;
  lineTotal?: number;
  category?: string;     // ที่เราเซฟลง items.<i>.category
  itemStatus?: string;   // ที่เราเซฟลง items.<i>.itemStatus
};

type Order = {
  id: string;
  orderNo?: number;
  date?: string;
  requester?: string;
  requesterName?: string;
  requesterUid?: string;
  total?: number;
  totalAmount?: number;
  status: OrderStatus;
  createdAt?: any;
  items?: OrderItem[];
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
};

/** ---------- Const ---------- */
const ITEM_CATEGORIES = ['วัตถุดิบ', 'Software', 'เครื่องมือ', 'วัสดุสิ้นเปลือง'] as const;

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'approved',    label: 'อนุมัติแล้ว' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'delivered',   label: 'ได้รับแล้ว' },
];

const STATUS_TH: Record<OrderStatus,string> = {
  pending:'รออนุมัติ', approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ', in_progress:'กำลังดำเนินการ', delivered:'ได้รับแล้ว'
};
const STATUS_BADGE: Record<OrderStatus,string> = {
  pending:'bg-yellow-100 text-yellow-800',
  approved:'bg-emerald-100 text-emerald-800',
  rejected:'bg-rose-100 text-rose-800',
  in_progress:'bg-sky-100 text-sky-800',
  delivered:'bg-emerald-100 text-emerald-800',
};

const ITEM_STATUS_G1 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ', 'สินค้าเข้าคลัง'] as const; // วัตถุดิบ
const ITEM_STATUS_G2 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ'] as const;                   // อื่นๆ
const getItemStatusOptions = (category?: string) =>
  category === 'วัตถุดิบ' ? ITEM_STATUS_G1 : ITEM_STATUS_G2;

/** ---------- Helpers ---------- */
const fmtTS = (ts:any) =>
  ts?.toDate
    ? ts.toDate().toLocaleString('th-TH',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
    : '—';

type Drafts = Record<string, Record<number, {category?:string; itemStatus?:string}>>;

/** ---------- Component ---------- */
export default function OrdersListPage(){
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole]     = useState<Role>(null);
  const [user, setUser]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [processingKeys, setProcessingKeys] = useState<Set<string>>(new Set()); // o.id หรือ `${o.id}:${idx}`
  const [drafts, setDrafts] = useState<Drafts>({});

  useEffect(() => {
    let unsub: (()=>void)|undefined;

    const off = subscribeAuthAndRole(async (authUser, r)=>{
      if(!authUser){ window.location.href='/login'; return; }
      setUser(authUser);

      let effective: Role = (r as Role) || (localStorage.getItem('role') as Role) || null;
      if(!effective){
        try{
          const u = await getDoc(doc(db,'users',authUser.uid));
          if(u.exists()) effective = (u.data() as any)?.role ?? null;
        }catch{}
      }
      setRole(effective);

      unsub?.();
      const qRef = query(collection(db,'orders'));
      unsub = onSnapshot(
        qRef,
        (snap)=>{
          const list = snap.docs.map(d => ({id:d.id, ...(d.data() as any)})) as Order[];
          list.sort((a:any,b:any)=>{
            const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb-ta;
          });
          setOrders(list);
          setErr('');
          setLoading(false);
        },
        (e)=>{ setErr(String(e?.message||e)); setLoading(false); }
      );
    });

    return ()=>{ unsub?.(); off?.(); };
  },[]);

  const toggle = (id:string)=> setExpanded(prev=>({...prev,[id]:!prev[id]}));

  // ใช้ค่าจาก draft ถ้ามี ไม่งั้นดูจาก doc (array หรือ map)
  const getItemValue = (o:Order, idx:number)=>{
    const d = drafts[o.id]?.[idx] || {};
    const mapCat = o.itemsCategories?.[String(idx)];
    const mapSt  = o.itemsStatuses?.[String(idx)];
    const item   = (o.items || [])[idx] || {};
    return {
      category: d.category   ?? item.category   ?? mapCat ?? '',
      itemStatus: d.itemStatus ?? item.itemStatus ?? mapSt  ?? '',
    };
  };

  const setDraft = (orderId:string, idx:number, patch:Partial<{category:string; itemStatus:string}>)=>{
    setDrafts(prev=>{
      const cur = {...(prev[orderId]?.[idx]||{})};
      const next = {...cur, ...patch};
      return {...prev, [orderId]: {...(prev[orderId]||{}), [idx]: next}};
    });
  };

  /** บันทึกรายการเดียว: อัปเดตทั้ง array + maps */
  const saveOneItem = async (o:Order, idx:number)=>{
    const val = getItemValue(o, idx);
    if(!val.category && !val.itemStatus){ alert('ยังไม่ได้เลือกประเภท/สถานะ'); return; }

    const key = `${o.id}:${idx}`;
    try{
      setProcessingKeys(s=>new Set(s).add(key));

      const ref = doc(db,'orders',o.id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const items: OrderItem[] = Array.isArray(data.items) ? [...data.items] : [];
      items[idx] = { ...(items[idx]||{}), category: val.category, itemStatus: val.itemStatus };

      const itemsCategories = { ...(data.itemsCategories||{}) };
      const itemsStatuses   = { ...(data.itemsStatuses||{}) };
      itemsCategories[String(idx)] = val.category;
      itemsStatuses[String(idx)]   = val.itemStatus;

      await updateDoc(ref,{
        items,
        itemsCategories,
        itemsStatuses,
        updatedAt: serverTimestamp(),
      });

      // clear draft for this row
      setDrafts(prev=>{
        const forOrder = {...(prev[o.id]||{})};
        delete forOrder[idx];
        return {...prev, [o.id]: forOrder};
      });
      alert('บันทึกสำเร็จ');
    }catch(e:any){
      console.error(e);
      alert(`บันทึกไม่สำเร็จ: ${e?.message||e}`);
    }finally{
      setProcessingKeys(s=>{ const n=new Set(s); n.delete(key); return n; });
    }
  };

  /** เปลี่ยนสถานะ “ใบ” (คืนความสามารถให้เปลี่ยนได้) */
  const saveOrderStatus = async (o:Order, next: OrderStatus)=>{
    const key = o.id;
    try{
      setProcessingKeys(s=>new Set(s).add(key));
      await updateDoc(doc(db,'orders',o.id), {
        status: next,
        updatedAt: serverTimestamp(),
      });
    }catch(e:any){
      console.error(e);
      alert(`อัปเดตสถานะใบไม่สำเร็จ: ${e?.message||e}`);
    }finally{
      setProcessingKeys(s=>{ const n=new Set(s); n.delete(key); return n; });
    }
  };

  if(loading){
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <div className="loading loading-spinner loading-lg" />
        <div className="mt-3 text-gray-600">กำลังโหลดข้อมูล…</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {err && <div className="alert alert-error mb-4">{err}</div>}

      <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">รายการใบสั่งซื้อ</h2>
              <p className="text-sm text-gray-600">สำหรับฝ่ายจัดซื้อ – เปลี่ยนสถานะใบ + จัดประเภท/สถานะของแต่ละรายการ</p>
            </div>
            <div className="text-xs text-gray-500 bg-slate-50 border rounded px-2 py-1">
              User: {user?.email||user?.uid} | Role: {role||'unknown'} | Orders: {orders.length}
            </div>
          </div>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">วันที่</th>
                  <th className="px-4 py-3">ผู้ขอ</th>
                  <th className="px-4 py-3 text-right">ยอดรวม</th>
                  <th className="px-4 py-3">สถานะใบ</th>
                  <th className="px-4 py-3">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(o=>{
                  const isOpen = !!expanded[o.id];
                  const total = (o.totalAmount??o.total??0) as number;

                  return (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          <button className="inline-flex items-center gap-1 hover:underline" onClick={()=>toggle(o.id)}>
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            #{o.orderNo ?? '-'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{o.date || fmtTS(o.createdAt)}</td>
                        <td className="px-4 py-3">{o.requesterName || o.requester || '-'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{total.toLocaleString('th-TH')} บาท</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[o.status]}`}>
                            {STATUS_TH[o.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {role === 'procurement' ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="select select-sm select-bordered rounded-xl min-w-[180px]"
                                value={o.status}
                                onChange={(e)=>saveOrderStatus(o, e.target.value as OrderStatus)}
                                disabled={processingKeys.has(o.id)}
                              >
                                {ORDER_STATUS_OPTIONS.map(x=>(
                                  <option key={x.value} value={x.value}>{x.label}</option>
                                ))}
                              </select>
                              {processingKeys.has(o.id) && <span className="loading loading-spinner loading-xs" />}
                            </div>
                          ) : <span className="text-gray-600">—</span>}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={6} className="px-6 pb-5">
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                              <div className="px-4 py-3 text-sm font-semibold text-gray-700">รายการสินค้า</div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50">
                                    <tr className="text-left text-slate-600">
                                      <th className="px-4 py-2">#</th>
                                      <th className="px-4 py-2">รายการ</th>
                                      <th className="px-4 py-2">จำนวน</th>
                                      <th className="px-4 py-2">ราคา/หน่วย</th>
                                      <th className="px-4 py-2">รวม</th>
                                      <th className="px-4 py-2 w-[220px]">ประเภทสินค้า</th>
                                      <th className="px-4 py-2 w-[220px]">สถานะรายการ</th>
                                      <th className="px-4 py-2 w-[120px] text-right">บันทึก</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {(o.items||[]).map((it, idx)=>{
                                      const val = getItemValue(o, idx);
                                      const options = getItemStatusOptions(val.category);

                                      return (
                                        <tr key={idx} className="align-top">
                                          <td className="px-4 py-2">{idx+1}</td>
                                          <td className="px-4 py-2">{it.description || '-'}</td>
                                          <td className="px-4 py-2">{it.quantity ?? '-'}</td>
                                          <td className="px-4 py-2">{it.amount!=null ? Number(it.amount).toLocaleString('th-TH') : '-'}</td>
                                          <td className="px-4 py-2 font-medium">{it.lineTotal!=null ? Number(it.lineTotal).toLocaleString('th-TH') : '-'}</td>

                                          <td className="px-4 py-2">
                                            <select
                                              className="select select-sm select-bordered rounded-lg w-full"
                                              value={val.category}
                                              onChange={(e)=>setDraft(o.id, idx, {category: e.target.value})}
                                              disabled={processingKeys.has(`${o.id}:${idx}`)}
                                            >
                                              <option value="" disabled>เลือกประเภท…</option>
                                              {ITEM_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
                                            </select>
                                          </td>

                                          <td className="px-4 py-2">
                                            <select
                                              className="select select-sm select-bordered rounded-lg w-full"
                                              value={val.itemStatus}
                                              onChange={(e)=>setDraft(o.id, idx, {itemStatus: e.target.value})}
                                              disabled={processingKeys.has(`${o.id}:${idx}`)}
                                            >
                                              <option value="" disabled>เลือกสถานะ…</option>
                                              {options.map(s=> <option key={s} value={s}>{s}</option>)}
                                            </select>
                                          </td>

                                          <td className="px-4 py-2 text-right">
                                            <button
                                              className="btn btn-sm btn-primary rounded-lg"
                                              onClick={()=>saveOneItem(o, idx)}
                                              disabled={processingKeys.has(`${o.id}:${idx}`)}
                                            >
                                              {processingKeys.has(`${o.id}:${idx}`) && <span className="loading loading-spinner loading-xs mr-1" />}
                                              บันทึก
                                            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
