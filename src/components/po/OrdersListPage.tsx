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
import { ChevronDown, ChevronRight, Loader2, Search, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

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

const ITEM_STATUS_G1 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ', 'สินค้าเข้าคลัง'] as const;
const ITEM_STATUS_G2 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ'] as const;
const getItemStatusOptions = (category?: string) =>
  category === 'วัตถุดิบ' ? ITEM_STATUS_G1 : ITEM_STATUS_G2;

const fmtTS = (ts:any) =>
  ts?.toDate
    ? ts.toDate().toLocaleString('th-TH',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
    : '—';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter orders based on search term
    // This will be implemented with the filtered orders
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.requesterName?.toLowerCase().includes(searchLower) ||
      order.requester?.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      order.orderNo?.toString().includes(searchTerm)
    );
  });

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
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <div className="mt-3 text-muted-foreground">กำลังโหลดข้อมูล…</div>
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
        <h1 className="text-3xl font-bold mb-2">รายการใบขอซื้อ</h1>
        <p className="text-muted-foreground">
          {role === 'procurement' ? 'สำหรับฝ่ายจัดซื้อ – เปลี่ยนสถานะใบ + จัดประเภท/สถานะของแต่ละรายการ' : 
           role === 'supervisor' ? 'สำหรับหัวหน้างาน – ดูรายการใบขอซื้อทั้งหมด' :
           'รายการใบขอซื้อทั้งหมด'}
        </p>
      </div>  

      <Card>
        <CardHeader className="pb-2 px-6">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อผู้ขอซื้อหรือหมายเลขใบขอซื้อ"
                  className="pl-10 w-full lg:w-74"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-muted px-1.5 py-0.5 text-xs rounded">Enter</kbd>
                )}
              </div>
            </form>

            <div className="flex gap-2">
              <Button
                className="font-normal"
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                รีเฟรช
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-4 text-lg">โหลดข้อมูลใบสั่งซื้อ...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center p-12">
              <h3 className="text-xl font-semibold mb-2">ไม่พบข้อมูลใบสั่งซื้อ</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'ลองปรับเงื่อนไขการค้นหา' : 'ยังไม่มีใบสั่งซื้อในระบบ'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รายการที่</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ผู้ขอซื้อ</TableHead>
                    <TableHead>ยอดรวม</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(o=>{
                  const isOpen = !!expanded[o.id];
                  const total = (o.totalAmount??o.total??0) as number;

                  return (
                    <React.Fragment key={o.id}>
                      <TableRow>
                        <TableCell className="font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="inline-flex items-center gap-1 h-auto p-0 font-medium"
                            onClick={()=>toggle(o.id)}
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            #{o.orderNo ?? '-'}
                          </Button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{o.date || fmtTS(o.createdAt)}</TableCell>
                        <TableCell>{o.requesterName || o.requester || '-'}</TableCell>
                        <TableCell className="tabular-nums">{total.toLocaleString('th-TH')} บาท</TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE[o.status]}>
                            {STATUS_TH[o.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {role === 'procurement' ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={o.status}
                                onValueChange={(value)=>saveOrderStatus(o, value as OrderStatus)}
                                disabled={processingKeys.has(o.id)}
                              >
                                <SelectTrigger className="w-[180px]">
                                 <SelectValue placeholder="เลือกสถานะ…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ORDER_STATUS_OPTIONS.map(x=>(
                                    <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {processingKeys.has(o.id) && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>

                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <div className="bg-muted/50 p-4">
                              <div className="rounded-md border bg-background overflow-hidden">
                                <div className="px-4 py-3 text-sm font-semibold border-b">รายการสินค้า</div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>รายละเอียด</TableHead>
                                        <TableHead>จำนวน</TableHead>
                                        <TableHead>ราคาต่อหน่วย(บาท)</TableHead>
                                        <TableHead>รวมทั้งสิ้น(บาท)</TableHead>
                                        <TableHead>ประเภทสินค้า</TableHead>
                                        <TableHead>สถานะรายการ</TableHead>
                                        {role === 'procurement' && (
                                          <TableHead></TableHead>
                                        )}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {(o.items||[]).map((it, idx)=>{
                                      const val = getItemValue(o, idx);
                                      const options = getItemStatusOptions(val.category);

                                      return (
                                        <TableRow key={idx}>
                                          <TableCell>{it.description || '-'}</TableCell>
                                          <TableCell>{it.quantity ?? '-'}</TableCell>
                                          <TableCell>{it.amount!=null ? Number(it.amount).toLocaleString('th-TH') : '-'}</TableCell>
                                          <TableCell>{it.lineTotal!=null ? Number(it.lineTotal).toLocaleString('th-TH') : '-'}</TableCell>

                                          <TableCell>
                                            {role === 'procurement' ? (
                                              <Select
                                                value={val.category}
                                                onValueChange={(value)=>setDraft(o.id, idx, {category: value})}
                                                disabled={processingKeys.has(`${o.id}:${idx}`)}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder="เลือกประเภท…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {ITEM_CATEGORIES.map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Badge variant={val.category ? "secondary" : "outline"}>
                                                {val.category || 'ยังไม่ระบุ'}
                                              </Badge>
                                            )}
                                          </TableCell>

                                          <TableCell>
                                            {role === 'procurement' ? (
                                              <Select
                                                value={val.itemStatus}
                                                onValueChange={(value)=>setDraft(o.id, idx, {itemStatus: value})}
                                                disabled={processingKeys.has(`${o.id}:${idx}`)}
                                              >
                                                <SelectTrigger>
                                                 <SelectValue placeholder="เลือกประเภท…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {options.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Badge variant={val.itemStatus ? "default" : "outline"}>
                                                {val.itemStatus || 'รอดำเนินการ'}
                                              </Badge>
                                            )}
                                          </TableCell>

                                          {role === 'procurement' && (
                                            <TableCell>
                                              <Button
                                                className="bg-[#6EC1E4] hover:bg-[#2b9ccc] font-normal"
                                                size="sm"
                                                onClick={()=>saveOneItem(o, idx)}
                                                disabled={processingKeys.has(`${o.id}:${idx}`)}
                                              >
                                                {processingKeys.has(`${o.id}:${idx}`) && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                                บันทึก
                                              </Button>
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      );
                                    })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}