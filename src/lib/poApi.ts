import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ---------- Types ----------
export type Item = {
  no: number;
  description: string;
  receivedDate: string;
  quantity: string;
  amount: string;
};

export type Order = {
  id: string;
  orderNo: string;
  date: string;
  requester: string;
  department?: string;
  items: Item[];
  totalAmount: number;
  status: 'pending'|'approved'|'rejected'|'in_progress'|'delivered';
  createdAt: any;
  createdBy: string;        // uid ผู้สร้าง
  createdByName: string;    // ชื่อแสดงผล
  tracking: {
    requestedBy: string;
    supervisorApproval: null | { approved: boolean; at: any; by?: string };
    procurementSteps: { received:boolean; ordered:boolean; checking:boolean; shipped:boolean; delivered:boolean };
  };
};

// ---------- Helpers ----------
export const toNum = (v: string) => {
  const n = parseFloat((v ?? '').toString().replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
export const lineTotal = (it: Item) => toNum(it.quantity) * toNum(it.amount);
export const grandTotal = (items: Item[]) => items.reduce((s, it) => s + lineTotal(it), 0);

// ---------- Create ----------
export async function createOrder(payload: { date:string; requester:string; items: Item[]; department?:string }) {
  const u = auth.currentUser;
  const totalAmount = grandTotal(payload.items);

  const ref = await addDoc(collection(db, 'orders'), {
    orderNo: '',
    date: payload.date,
    requester: payload.requester,
    department: payload.department ?? '',
    items: payload.items,
    totalAmount,
    status: 'pending',
    createdAt: serverTimestamp(),
    createdBy: u?.uid ?? '',
    createdByName: u?.displayName ?? (u?.email?.split('@')[0] ?? payload.requester),
    tracking: {
      requestedBy: payload.requester,
      supervisorApproval: null,
      procurementSteps: { received:false, ordered:false, checking:false, shipped:false, delivered:false }
    }
  });

  const orderNo = `PO-${ref.id.slice(-6).toUpperCase()}`;
  await updateDoc(ref, { orderNo });
  return { id: ref.id, orderNo };
}

// ---------- List ----------
export function listenOrdersAll(cb: (rows: Order[]) => void) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Order[]));
}

export function listenOrdersMine(uid: string, cb: (rows: Order[]) => void) {
  const q = query(collection(db, 'orders'), where('createdBy', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Order[]));
}

// ---------- Actions ----------
export async function approveOrder(orderId: string, approved: boolean) {
  const u = auth.currentUser;
  await updateDoc(doc(db, 'orders', orderId), {
    status: approved ? 'approved' : 'rejected',
    'tracking.supervisorApproval': { approved, at: serverTimestamp(), by: u?.uid ?? '' },
  });
}

export async function setOrderStatus(orderId: string, status: Order['status']) {
  await updateDoc(doc(db, 'orders', orderId), { status });
}
