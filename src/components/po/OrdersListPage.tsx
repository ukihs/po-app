"use client";

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
  orderBy,
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import OrdersDataTable from './OrdersDataTable';
import type { Order, OrderStatus, OrderItem, UserRole } from '../../types';
import { COLLECTIONS } from '../../lib/constants';

type Drafts = Record<string, Record<number, {category?:string; itemStatus?:string}>>;

export default function OrdersListPage(){
  const { user, role, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [processingKeys, setProcessingKeys] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Drafts>({});

  useEffect(() => {
    if (!user || !role || authLoading) return;

    const qRef = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Order[];
        setOrders(list);
        setErr('');
        setLoading(false);
      },
      (e) => { 
        setErr(String(e?.message || e)); 
        setLoading(false); 
      }
    );

    return () => unsub();
  }, [user, role, authLoading]);

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

  const saveOneItem = async (o: Order, idx: number) => {
    const val = getItemValue(o, idx);
    if (!val.category && !val.itemStatus) { 
      toast.error('ยังไม่ได้เลือกประเภท/สถานะ'); 
      return; 
    }

    const key = `${o.id}:${idx}`;
    try {
      setProcessingKeys(s => new Set(s).add(key));

      const ref = doc(db, COLLECTIONS.ORDERS, o.id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const items: OrderItem[] = Array.isArray(data.items) ? [...data.items] : [];
      items[idx] = { ...(items[idx] || {}), category: val.category, itemStatus: val.itemStatus };

      const itemsCategories = { ...(data.itemsCategories || {}) };
      const itemsStatuses = { ...(data.itemsStatuses || {}) };
      itemsCategories[String(idx)] = val.category;
      itemsStatuses[String(idx)] = val.itemStatus;

      await updateDoc(ref, {
        items,
        itemsCategories,
        itemsStatuses,
        updatedAt: serverTimestamp(),
      });

      setDrafts(prev => {
        const forOrder = { ...(prev[o.id] || {}) };
        delete forOrder[idx];
        return { ...prev, [o.id]: forOrder };
      });
      toast.success('บันทึกสำเร็จ');
    } catch (e: any) {
      console.error(e);
      toast.error(`บันทึกไม่สำเร็จ: ${e?.message || e}`);
    } finally {
      setProcessingKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  const saveOrderStatus = async (o: Order, next: OrderStatus) => {
    const key = o.id;
    try {
      setProcessingKeys(s => new Set(s).add(key));
      await updateDoc(doc(db, COLLECTIONS.ORDERS, o.id), {
        status: next,
        updatedAt: serverTimestamp(),
      });
      toast.success('อัปเดตสถานะสำเร็จ');
    } catch (e: any) {
      console.error(e);
      toast.error(`อัปเดตสถานะไม่สำเร็จ: ${e?.message || e}`);
    } finally {
      setProcessingKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="w-full py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="mt-3 text-muted-foreground">กำลังโหลดข้อมูล…</div>
      </div>
    );
  }

  if (!user || !role) {
    return (
      <div className="w-full py-10 text-center">
        <Alert variant="destructive">
          <AlertDescription>กรุณาเข้าสู่ระบบ</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Toaster />
      
      {err && (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          รายการใบขอซื้อ
        </h1>
        <p className="text-muted-foreground">
          {role === 'procurement' ? 'เปลี่ยนสถานะใบขอซื้อ กำหนดประเภทและสถานะของแต่ละรายการ' : 
           role === 'supervisor' ? 'ดูรายการใบขอซื้อทั้งหมด' :
           'รายการใบขอซื้อทั้งหมด'}
        </p>
      </div>  

      <OrdersDataTable
        data={orders}
        loading={loading}
        role={role}
        expanded={expanded}
        processingKeys={processingKeys}
        drafts={drafts}
        onToggleExpanded={toggle}
        onSaveOrderStatus={saveOrderStatus}
        onSaveItem={saveOneItem}
        onSetDraft={setDraft}
        onGetItemValue={getItemValue}
      />
    </div>
  );
}