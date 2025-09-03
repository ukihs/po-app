// src/lib/poApi.ts
import {
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
  doc,
  getDoc,
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
