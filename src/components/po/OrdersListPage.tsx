import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/client';
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
import { Loader2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty';
import { Button } from '../ui/button';
import OrdersDataTable from './OrdersDataTable';

type Role = 'buyer' | 'supervisor' | 'procurement' | null;
type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

type OrderItem = {
  description?: string;
  quantity?: number;
  amount?: number;
  lineTotal?: number;
  category?: string;
  itemStatus?: string;
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


type Drafts = Record<string, Record<number, {category?:string; itemStatus?:string}>>;

export default function OrdersListPage(){
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole]     = useState<Role>(null);
  const [user, setUser]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [processingKeys, setProcessingKeys] = useState<Set<string>>(new Set());
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
      <div className="w-full py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="mt-3 text-muted-foreground">กำลังโหลดข้อมูล…</div>
      </div>
    );
  }

  if (orders.length === 0 && !loading) {
    return (
      <div className="w-full">
        {err && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>ยังไม่มีใบขอซื้อ</EmptyTitle>
            <EmptyDescription>
              ขณะนี้ยังไม่มีใบขอซื้อใดๆ ในระบบ
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="w-full">
      {err && (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <FileText className="w-8 h-8 text-primary" />
          รายการใบขอซื้อ
        </h1>
      </div>  

      <OrdersDataTable
        data={orders}
        loading={loading}
        onViewOrder={(order) => window.open(`/orders/${order.id}`, '_blank')}
        onDeleteOrder={() => {}} // OrdersListPage doesn't support delete
      />
    </div>
  );
}