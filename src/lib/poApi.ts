// src/lib/poApi.ts
import {
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export type Item = {
  no: number;
  description: string;
  receivedDate: string;
  quantity: string;
  amount: string;
};

export const toNum = (v: string) => {
  const n = parseFloat((v ?? '').toString().replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
export const lineTotal = (it: Item) => toNum(it.quantity) * toNum(it.amount);
export const grandTotal = (items: Item[]) =>
  items.reduce((s, it) => s + lineTotal(it), 0);

// ---------- เลขรันแบบ transaction ----------
async function getNextNumber(seqDocId = 'orders'): Promise<number> {
  const ref = doc(db, 'counters', seqDocId);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const last = (snap.exists() ? (snap.data() as any).last : 0) || 0;
    const n = last + 1;
    tx.set(ref, { last: n }, { merge: true });
    return n;
  });
  return next;
}

export async function createOrder(payload: {
  date: string;
  requesterName: string;
  items: Item[];
}) {
  const u = auth.currentUser;
  if (!u) throw new Error('ยังไม่ได้ล็อกอิน');

  // 1) เลขรันใบสั่งซื้อ
  const orderNo = await getNextNumber('orders'); // <- จะได้ 1,2,3,…

  // 2) ข้อมูลรายการ
  const cleanItems = payload.items.map((it) => ({
    description: it.description.trim(),
    receivedDate: it.receivedDate || null,
    quantity: toNum(it.quantity),
    amount: toNum(it.amount),
    lineTotal: lineTotal(it),
  }));

  // 3) อ่าน profile ผู้ใช้เพื่อหาหัวหน้างาน
  const meProfileSnap = await getDoc(doc(db, 'users', u.uid));
  const meProfile = meProfileSnap.exists() ? (meProfileSnap.data() as any) : {};
  // ตั้งค่าใน users/{uid} ล่วงหน้า: supervisorUid, supervisorName
  // ถ้าไม่มี ให้ fallback เป็นตัวเองไปก่อน (จะเห็น noti แน่ๆ)
  const supervisorUid = meProfile.supervisorUid || u.uid;
  const supervisorName =
    meProfile.supervisorName ||
    u.displayName ||
    (u.email ?? '').split('@')[0] ||
    'หัวหน้างาน';

  // 4) บันทึกใบสั่งซื้อ
  const docData = {
    requesterUid: u.uid,
    requesterName: payload.requesterName,
    date: payload.date,
    items: cleanItems,
    total: cleanItems.reduce((s, x) => s + x.lineTotal, 0),
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered',
    createdAt: serverTimestamp(),
    orderNo, // << เลขรัน
  };

  const ref = await addDoc(collection(db, 'orders'), docData);

  // 5) สร้างแจ้งเตือนถึง "หัวหน้างาน"
  await addDoc(collection(db, 'notifications'), {
    toUserUid: supervisorUid,
    toUserName: supervisorName,
    fromUserUid: u.uid,
    fromUserName: payload.requesterName,
    orderId: ref.id,      // เก็บไว้เผื่อคลิกลิงก์ไปหน้าใบสั่งซื้อ
    orderNo,              // << แนบเลขรันให้ด้วย
    title: 'มีใบสั่งซื้อใหม่รออนุมัติ',
    message: `ใบสั่งซื้อ #${orderNo} โดย ${payload.requesterName}`,
    kind: 'approval_request',
    read: false,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

// Export Order type for use in components
export type Order = {
  id: string;
  orderNo: number;
  date: string;
  requester: string;
  requesterUid: string;
  items: Array<{
    description: string;
    receivedDate: string | null;
    quantity: number;
    amount: number;
    lineTotal: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';
  createdAt: any;
};

// Listen to all orders (for supervisor/procurement)
export function listenOrdersAll(callback: (orders: Order[]) => void) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      orderNo: doc.data().orderNo || 0,
      date: doc.data().date || '',
      requester: doc.data().requesterName || '',
      requesterUid: doc.data().requesterUid || '',
      items: doc.data().items || [],
      totalAmount: Number(doc.data().total || 0),
      status: (doc.data().status || 'pending') as Order['status'],
      createdAt: doc.data().createdAt,
    })) as Order[];
    callback(orders);
  });
}

// Approve or reject order (for supervisor)
export async function approveOrder(orderId: string, approved: boolean) {
  const orderRef = doc(db, 'orders', orderId);
  const newStatus = approved ? 'approved' : 'rejected';
  
  await updateDoc(orderRef, {
    status: newStatus,
    approvedAt: serverTimestamp(),
    approvedBy: auth.currentUser?.uid
  });

  // Get order data for notifications
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return;
  
  const orderData = orderSnap.data();
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // 1) แจ้งเตือน buyer ว่าได้รับการอนุมัติ/ไม่อนุมัติ
  await addDoc(collection(db, 'notifications'), {
    toUserUid: orderData.requesterUid,
    toUserName: orderData.requesterName,
    fromUserUid: currentUser.uid,
    fromUserName: currentUser.displayName || 'หัวหน้างาน',
    orderId: orderId,
    orderNo: orderData.orderNo,
    title: approved ? 'ใบสั่งซื้อได้รับการอนุมัติ' : 'ใบสั่งซื้อไม่ได้รับการอนุมัติ',
    message: `ใบสั่งซื้อ #${orderData.orderNo} ${approved ? 'ได้รับการอนุมัติแล้ว' : 'ไม่ได้รับการอนุมัติ'}`,
    kind: approved ? 'approved' : 'rejected',
    read: false,
    createdAt: serverTimestamp(),
  });

  // 2) ถ้าอนุมัติ แจ้งเตือนฝ่ายจัดซื้อ (ส่งไปยัง role procurement)
  if (approved) {
    await addDoc(collection(db, 'notifications'), {
      toUserUid: null, // ส่งไปหา role แทน user เฉพาะ
      toUserName: null,
      fromUserUid: currentUser.uid,
      fromUserName: currentUser.displayName || 'หัวหน้างาน',
      orderId: orderId,
      orderNo: orderData.orderNo,
      title: 'มีใบสั่งซื้อใหม่ที่ได้รับการอนุมัติ',
      message: `ใบสั่งซื้อ #${orderData.orderNo} ได้รับการอนุมัติแล้ว กรุณาดำเนินการจัดซื้อ`,
      kind: 'status_update',
      read: false,
      createdAt: serverTimestamp(),
      // เพิ่ม field สำหรับ role-based notification
      forRole: 'procurement',
    });
  }
}

// Set order status (for procurement)
export async function setOrderStatus(orderId: string, status: Order['status']) {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status: status,
    updatedAt: serverTimestamp()
  });

  // Create notification for the requester
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return;
  
  const orderData = orderSnap.data();
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  await addDoc(collection(db, 'notifications'), {
    toUserUid: orderData.requesterUid,
    toUserName: orderData.requesterName,
    fromUserUid: currentUser.uid,
    fromUserName: currentUser.displayName || 'ฝ่ายจัดซื้อ',
    orderId: orderId,
    orderNo: orderData.orderNo,
    title: 'สถานะใบสั่งซื้อมีการเปลี่ยนแปลง',
    message: `ใบสั่งซื้อ #${orderData.orderNo} อัปเดตสถานะเป็น ${getStatusLabel(status)}`,
    kind: 'status_update',
    read: false,
    createdAt: serverTimestamp(),
  });
}

function getStatusLabel(status: Order['status']): string {
  switch (status) {
    case 'pending': return 'รออนุมัติ';
    case 'approved': return 'อนุมัติแล้ว';
    case 'rejected': return 'ไม่อนุมัติ';
    case 'in_progress': return 'กำลังดำเนินการ';
    case 'delivered': return 'ได้รับแล้ว';
    default: return status;
  }
}