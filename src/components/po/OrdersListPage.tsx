"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/client';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useUser, useRole, useIsLoading, useOrders, useOrdersLoading, useOrdersError } from '../../stores';
import { Loader2, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../ui/alert';
import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiSpam3Fill, 
  RiInformationFill 
} from '@remixicon/react';
import OrdersDataTable from './OrdersDataTable';
import type { Order, OrderStatus, OrderItem, UserRole } from '../../types';
import { COLLECTIONS } from '../../lib/constants';

type Drafts = Record<string, Record<number, {category?:string; itemStatus?:string}>>;

export default function OrdersListPage(){
  const user = useUser();
  const role = useRole();
  const authLoading = useIsLoading();
  const orders = useOrders();
  const loading = useOrdersLoading();
  const err = useOrdersError();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [processingKeys, setProcessingKeys] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Drafts>({});
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    description?: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    description: ''
  });

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', description?: string) => {
    setAlertState({
      show: true,
      type,
      title: message,
      description
    });

    const duration = type === 'error' ? 5000 : 4000;
    setTimeout(() => {
      setAlertState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          variant: 'success' as const,
          appearance: 'light' as const,
          IconComponent: RiCheckboxCircleFill
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          appearance: 'light' as const,
          IconComponent: RiErrorWarningFill
        };
      case 'warning':
        return {
          variant: 'warning' as const,
          appearance: 'light' as const,
          IconComponent: RiSpam3Fill
        };
      case 'info':
      default:
        return {
          variant: 'info' as const,
          appearance: 'light' as const,
          IconComponent: RiInformationFill
        };
    }
  };

  const toggle = (id:string)=> setExpanded(prev=>({...prev,[id]:!prev[id]}));

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#order-')) {
      const orderId = hash.replace('#order-', '');
      
      if (!loading && orders.length > 0) {
        setTimeout(() => {
          const element = document.getElementById(`order-${orderId}`);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all', 'duration-300');
            
            setExpanded(prev => ({ ...prev, [orderId]: true }));
            
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 3000);
            
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 500);
      }
    }
  }, [loading, orders]);

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
    // ป้องกันไม่ให้แก้ไขรายการสินค้าของใบขอซื้อที่ถูก "ไม่อนุมัติ" ไปแล้ว
    if (o.status === 'rejected') {
      showAlert('ไม่สามารถแก้ไขรายการสินค้าได้', 'error', 'ใบขอซื้อที่ถูกไม่อนุมัติแล้วไม่สามารถแก้ไขรายการสินค้าได้');
      return;
    }

    const val = getItemValue(o, idx);
    if (!val.category && !val.itemStatus) { 
      showAlert('ยังไม่ได้เลือกประเภท/สถานะ', 'error'); 
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
      showAlert('บันทึกรายการสินค้าสำเร็จ', 'success');
    } catch (e: any) {
      console.error(e);
      showAlert('ไม่สามารถบันทึกรายการสินค้าได้', 'error', e?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
    } finally {
      setProcessingKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  const saveOrderStatus = async (o: Order, next: OrderStatus) => {
    if (o.status === 'rejected') {
      showAlert('ไม่สามารถแก้ไขสถานะได้', 'error', 'ใบขอซื้อที่ถูกไม่อนุมัติแล้วไม่สามารถแก้ไขสถานะได้');
      return;
    }

    const key = o.id;
    try {
      setProcessingKeys(s => new Set(s).add(key));
      await updateDoc(doc(db, COLLECTIONS.ORDERS, o.id), {
        status: next,
        updatedAt: serverTimestamp(),
      });
      showAlert('อัปเดตสถานะใบขอซื้อสำเร็จ', 'success');
    } catch (e: any) {
      console.error(e);
      showAlert('ไม่สามารถอัปเดตสถานะได้', 'error', e?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
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
      {alertState.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert 
            variant={getAlertConfig(alertState.type).variant}
            appearance={getAlertConfig(alertState.type).appearance}
            close
            onClose={() => setAlertState(prev => ({ ...prev, show: false }))}
          >
            <AlertIcon>
              {React.createElement(getAlertConfig(alertState.type).IconComponent, { className: "h-4 w-4" })}
            </AlertIcon>
            <AlertTitle>{alertState.title}</AlertTitle>
            {alertState.description && (
              <AlertDescription>{alertState.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}
      
      {err && (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">รายการใบขอซื้อ</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {role === 'procurement' 
                ? 'เปลี่ยนสถานะใบขอซื้อ กำหนดประเภทและสถานะของแต่ละรายการ' 
                : 'รายการใบขอซื้อทั้งหมด'}
            </p>
          </div>
        </div>
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