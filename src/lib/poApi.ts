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

export type ItemType = 'วัตถุดิบ' | 'เครื่องมือ' | 'วัสดุสิ้นเปลือง' | 'Software';
export type ProcurementStatus = 'จัดซื้อ' | 'ของมาส่ง' | 'ส่งมอบของ' | 'คลังสินค้า' | 'จัดซื้อ_2' | 'ของมาส่ง_2' | 'ส่งมอบของ_2';

export type Item = {
  no: number;
  description: string;
  receivedDate: string;
  quantity: string;
  amount: string;
  itemType: ItemType; // เพิ่ม field ประเภทสินค้า
};

export const toNum = (v: string) => {
  const n = parseFloat((v ?? '').toString().replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
export const lineTotal = (it: Item) => toNum(it.quantity) * toNum(it.amount);
export const grandTotal = (items: Item[]) =>
  items.reduce((s, it) => s + lineTotal(it), 0);

// Function to categorize items
export const getItemCategory = (itemType: ItemType): 'raw_material' | 'other' => {
  return itemType === 'วัตถุดิบ' ? 'raw_material' : 'other';
};

// Get initial procurement status based on item category
export const getInitialProcurementStatus = (itemType: ItemType): ProcurementStatus => {
  const category = getItemCategory(itemType);
  return category === 'raw_material' ? 'จัดซื้อ' : 'จัดซื้อ_2';
};

// Display procurement status
export const getProcurementStatusDisplay = (status: ProcurementStatus): string => {
  switch (status) {
    case 'จัดซื้อ':
    case 'จัดซื้อ_2':
      return 'จัดซื้อ';
    case 'ของมาส่ง':
    case 'ของมาส่ง_2':
      return 'ของมาส่ง';
    case 'ส่งมอบของ':
    case 'ส่งมอบของ_2':
      return 'ส่งมอบของ';
    case 'คลังสินค้า':
      return 'คลังสินค้า';
    default:
      return status;
  }
};

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
  const orderNo = await getNextNumber('orders');

  // 2) ข้อมูลรายการพร้อม itemType และ lineTotal
  const cleanItems = payload.items.map((it) => ({
    description: it.description.trim(),
    receivedDate: it.receivedDate || null,
    quantity: toNum(it.quantity),
    amount: toNum(it.amount),
    lineTotal: lineTotal(it),
    itemType: it.itemType, // เก็บประเภทสินค้า
  }));

  // 3) หาประเภทสินค้าหลักและกำหนด procurement status เริ่มต้น
  const primaryItemType = cleanItems[0]?.itemType || 'วัตถุดิบ';
  const initialProcurementStatus = getInitialProcurementStatus(primaryItemType);

  // 4) บันทึกใบสั่งซื้อพร้อม timestamps
  const docData = {
    requesterUid: u.uid,
    requesterName: payload.requesterName,
    date: payload.date,
    items: cleanItems,
    total: cleanItems.reduce((s, x) => s + x.lineTotal, 0),
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered',
    createdAt: serverTimestamp(),
    orderNo,
    procurementStatus: initialProcurementStatus,
    // เพิ่ม timestamps สำหรับติดตามสถานะ
    timestamps: {
      submitted: serverTimestamp(),
    }
  };

  const ref = await addDoc(collection(db, 'orders'), docData);

  // 5) ส่งแจ้งเตือนให้ supervisor role (แก้ให้ส่งไป role แทน uid เฉพาะ)
  await addDoc(collection(db, 'notifications'), {
    toUserUid: null, // ไม่ส่งให้ user เฉพาะ
    toUserName: null,
    fromUserUid: u.uid,
    fromUserName: payload.requesterName,
    orderId: ref.id,
    orderNo,
    title: 'มีใบสั่งซื้อใหม่รออนุมัติ',
    message: `ใบสั่งซื้อ #${orderNo} โดย ${payload.requesterName} รอการอนุมัติ`,
    kind: 'approval_request',
    read: false,
    createdAt: serverTimestamp(),
    forRole: 'supervisor', // ส่งไปหา role supervisor
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
    itemType: ItemType;
  }>;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';
  createdAt: any;
  procurementStatus?: ProcurementStatus;
  timestamps?: {
    submitted?: any;
    approved?: any;
    rejected?: any;
    procurementStarted?: any;
    procurementUpdated?: any;
    delivered?: any;
  };
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
      procurementStatus: doc.data().procurementStatus,
      timestamps: doc.data().timestamps || {},
    })) as Order[];
    callback(orders);
  });
}

// Approve or reject order (for supervisor)
export async function approveOrder(orderId: string, approved: boolean) {
  const orderRef = doc(db, 'orders', orderId);
  const newStatus = approved ? 'approved' : 'rejected';
  
  // เพิ่ม timestamp สำหรับ approval/rejection
  const timestampUpdate = approved ? 
    { 'timestamps.approved': serverTimestamp() } : 
    { 'timestamps.rejected': serverTimestamp() };
  
  await updateDoc(orderRef, {
    status: newStatus,
    approvedAt: serverTimestamp(),
    approvedBy: auth.currentUser?.uid,
    ...timestampUpdate
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

  // 2) ถ้าอนุมัติ แจ้งเตือนฝ่ายจัดซื้อ และเริ่ม procurement
  if (approved) {
    // อัปเดต timestamp สำหรับ procurement started
    await updateDoc(orderRef, {
      'timestamps.procurementStarted': serverTimestamp()
    });

    await addDoc(collection(db, 'notifications'), {
      toUserUid: null,
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
      forRole: 'procurement',
    });
  }
}

// Set procurement status (for procurement)
export async function setProcurementStatus(orderId: string, newStatus: ProcurementStatus) {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    procurementStatus: newStatus,
    updatedAt: serverTimestamp(),
    'timestamps.procurementUpdated': serverTimestamp(),
    // ถ้าเป็นสถานะสุดท้าย ให้เปลี่ยน order status เป็น delivered
    ...(newStatus === 'คลังสินค้า' || newStatus === 'ส่งมอบของ_2' ? {
      status: 'delivered',
      'timestamps.delivered': serverTimestamp()
    } : {})
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
    title: 'สถานะการจัดซื้อมีการเปลี่ยนแปลง',
    message: `ใบสั่งซื้อ #${orderData.orderNo} อัปเดตสถานะเป็น ${getProcurementStatusDisplay(newStatus)}`,
    kind: 'status_update',
    read: false,
    createdAt: serverTimestamp(),
  });
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

// ฟังก์ชันสำหรับสร้างเลขใบสั่งซื้อรูปแบบ PRปีเดือน-00x
export const generateOrderNumber = (orderNo: number, date: string): string => {
  const orderDate = new Date(date);
  const year = orderDate.getFullYear();
  const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
  const number = orderNo.toString().padStart(3, '0');
  
  return `PR${year}${month}-${number}`;
};

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