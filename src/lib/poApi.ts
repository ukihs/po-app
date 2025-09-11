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
  where,
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
  itemType: ItemType;
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

// ---------- Notification Helper Function ----------
async function createNotification(data: {
  title: string;
  message: string;
  orderId: string;
  orderNo: number;
  kind: 'approval_request' | 'approved' | 'rejected' | 'status_update';
  toUserUid?: string;
  forRole?: 'buyer' | 'supervisor' | 'procurement';
  fromUserName?: string;
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('createNotification: No current user');
    return;
  }

  const notificationData = {
    title: data.title,
    message: data.message,
    orderId: data.orderId,
    orderNo: data.orderNo,
    kind: data.kind,
    toUserUid: data.toUserUid || null,
    forRole: data.forRole || null,
    fromUserUid: currentUser.uid,
    fromUserName: data.fromUserName || currentUser.displayName || 'ระบบ',
    read: false,
    createdAt: serverTimestamp(),
  };

  console.log('createNotification: Creating notification', {
    title: data.title,
    kind: data.kind,
    toUserUid: data.toUserUid,
    forRole: data.forRole,
    orderId: data.orderId,
    orderNo: data.orderNo
  });

  try {
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('createNotification: Successfully created notification', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('createNotification: Error creating notification', error);
    throw error;
  }
}

// ---------- Order Functions ----------
export async function createOrder(payload: {
  date: string;
  requesterName: string;
  items: Item[];
}) {
  const u = auth.currentUser;
  if (!u) throw new Error('ยังไม่ได้ล็อกอิน');

  console.log('createOrder: Starting order creation', {
    requesterName: payload.requesterName,
    itemCount: payload.items.length,
    userUid: u.uid
  });

  // 1) เลขรันใบสั่งซื้อ
  const orderNo = await getNextNumber('orders');
  console.log('createOrder: Generated order number', orderNo);

  // 2) ข้อมูลรายการพร้อม itemType และ lineTotal
  const cleanItems = payload.items.map((it) => ({
    description: (it.description || '').trim(),
    receivedDate: it.receivedDate || '',
    quantity: toNum(it.quantity),
    amount: toNum(it.amount),
    lineTotal: lineTotal(it),
    itemType: it.itemType || 'วัตถุดิบ',
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
    totalAmount: cleanItems.reduce((s, x) => s + x.lineTotal, 0), // เพิ่มเพื่อ compatibility
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    orderNo,
    procurementStatus: initialProcurementStatus,
    timestamps: {
      submitted: serverTimestamp(),
    }
  };

  console.log('createOrder: Saving order to Firestore', {
    orderNo,
    total: docData.total,
    itemCount: cleanItems.length
  });

  const ref = await addDoc(collection(db, 'orders'), docData);
  console.log('createOrder: Order saved with ID', ref.id);

  // 5) ส่งแจ้งเตือนให้ supervisor role
  await createNotification({
    title: 'มีใบสั่งซื้อใหม่รออนุมัติ',
    message: `ใบสั่งซื้อ #${orderNo} โดย ${payload.requesterName} รอการอนุมัติ`,
    orderId: ref.id,
    orderNo,
    kind: 'approval_request',
    forRole: 'supervisor',
    fromUserName: payload.requesterName,
  });

  console.log('createOrder: Order creation completed', {
    orderId: ref.id,
    orderNo,
    notificationSent: true
  });

  return ref.id;
}

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
      totalAmount: Number(doc.data().total || doc.data().totalAmount || 0),
      status: (doc.data().status || 'pending') as Order['status'],
      createdAt: doc.data().createdAt,
      procurementStatus: doc.data().procurementStatus,
      timestamps: doc.data().timestamps || {},
    })) as Order[];
    callback(orders);
  });
}

// Listen to user's orders (for buyer)
export function listenUserOrders(userUid: string, callback: (orders: Order[]) => void) {
  const q = query(
    collection(db, 'orders'), 
    where('requesterUid', '==', userUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      orderNo: doc.data().orderNo || 0,
      date: doc.data().date || '',
      requester: doc.data().requesterName || '',
      requesterUid: doc.data().requesterUid || '',
      items: doc.data().items || [],
      totalAmount: Number(doc.data().total || doc.data().totalAmount || 0),
      status: (doc.data().status || 'pending') as Order['status'],
      createdAt: doc.data().createdAt,
      procurementStatus: doc.data().procurementStatus,
      timestamps: doc.data().timestamps || {},
    })) as Order[];
    callback(orders);
  });
}

// Get single order
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const orderSnap = await getDoc(doc(db, 'orders', orderId));
    if (!orderSnap.exists()) return null;
    
    const data = orderSnap.data();
    return {
      id: orderSnap.id,
      orderNo: data.orderNo || 0,
      date: data.date || '',
      requester: data.requesterName || '',
      requesterUid: data.requesterUid || '',
      items: data.items || [],
      totalAmount: Number(data.total || data.totalAmount || 0),
      status: (data.status || 'pending') as Order['status'],
      createdAt: data.createdAt,
      procurementStatus: data.procurementStatus,
      timestamps: data.timestamps || {},
    };
  } catch (error) {
    console.error('getOrder: Error fetching order', error);
    return null;
  }
}

// Approve or reject order (for supervisor)
export async function approveOrder(orderId: string, approved: boolean) {
  const orderRef = doc(db, 'orders', orderId);
  const newStatus = approved ? 'approved' : 'rejected';
  
  console.log('approveOrder: Processing approval', {
    orderId,
    approved,
    newStatus
  });

  // เพิ่ม timestamp สำหรับ approval/rejection
  const timestampUpdate = approved ? 
    { 'timestamps.approved': serverTimestamp() } : 
    { 'timestamps.rejected': serverTimestamp() };
  
  await updateDoc(orderRef, {
    status: newStatus,
    approvedAt: serverTimestamp(),
    approvedBy: auth.currentUser?.uid || '',
    ...timestampUpdate
  });

  // Get order data for notifications
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) {
    console.error('approveOrder: Order not found after update');
    return;
  }
  
  const orderData = orderSnap.data();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('approveOrder: No current user');
    return;
  }

  console.log('approveOrder: Sending notifications', {
    orderId,
    orderNo: orderData.orderNo,
    requesterUid: orderData.requesterUid,
    approved
  });

  // 1) แจ้งเตือน buyer ว่าได้รับการอนุมัติ/ไม่อนุมัติ
  await createNotification({
    title: approved ? 'ใบสั่งซื้อได้รับการอนุมัติ' : 'ใบสั่งซื้อไม่ได้รับการอนุมัติ',
    message: `ใบสั่งซื้อ #${orderData.orderNo} ${approved ? 'ได้รับการอนุมัติแล้ว' : 'ไม่ได้รับการอนุมัติ'}`,
    orderId: orderId,
    orderNo: orderData.orderNo || 0,
    kind: approved ? 'approved' : 'rejected',
    toUserUid: orderData.requesterUid,
    fromUserName: currentUser.displayName || 'หัวหน้างาน',
  });

  // 2) ถ้าอนุมัติ แจ้งเตือนฝ่ายจัดซื้อ และเริ่ม procurement
  if (approved) {
    // อัปเดต timestamp สำหรับ procurement started
    await updateDoc(orderRef, {
      'timestamps.procurementStarted': serverTimestamp()
    });

    await createNotification({
      title: 'มีใบสั่งซื้อใหม่ที่ได้รับการอนุมัติ',
      message: `ใบสั่งซื้อ #${orderData.orderNo} ได้รับการอนุมัติแล้ว กรุณาดำเนินการจัดซื้อ`,
      orderId: orderId,
      orderNo: orderData.orderNo || 0,
      kind: 'status_update',
      forRole: 'procurement',
      fromUserName: currentUser.displayName || 'หัวหน้างาน',
    });

    console.log('approveOrder: Sent notifications for approved order', {
      toBuyer: orderData.requesterUid,
      toProcurement: 'role-based',
      orderNo: orderData.orderNo
    });
  }

  console.log('approveOrder: Approval process completed', {
    orderId,
    approved,
    orderNo: orderData.orderNo
  });
}

// Set procurement status (for procurement)
export async function setProcurementStatus(orderId: string, newStatus: ProcurementStatus) {
  console.log('setProcurementStatus: Updating procurement status', {
    orderId,
    newStatus
  });

  const orderRef = doc(db, 'orders', orderId);
  
  // ตรวจสอบว่าเป็นสถานะสุดท้ายหรือไม่
  const isComplete = newStatus === 'คลังสินค้า' || newStatus === 'ส่งมอบของ_2';
  
  const updateData: any = {
    procurementStatus: newStatus,
    updatedAt: serverTimestamp(),
    'timestamps.procurementUpdated': serverTimestamp(),
  };

  if (isComplete) {
    updateData.status = 'delivered';
    updateData['timestamps.delivered'] = serverTimestamp();
    console.log('setProcurementStatus: Marking order as delivered');
  }

  await updateDoc(orderRef, updateData);

  // Create notification for the requester
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) {
    console.error('setProcurementStatus: Order not found after update');
    return;
  }
  
  const orderData = orderSnap.data();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('setProcurementStatus: No current user');
    return;
  }

  await createNotification({
    title: 'สถานะการจัดซื้อมีการเปลี่ยนแปลง',
    message: `ใบสั่งซื้อ #${orderData.orderNo} อัปเดตสถานะเป็น ${getProcurementStatusDisplay(newStatus)}`,
    orderId: orderId,
    orderNo: orderData.orderNo || 0,
    kind: 'status_update',
    toUserUid: orderData.requesterUid,
    fromUserName: currentUser.displayName || 'ฝ่ายจัดซื้อ',
  });

  console.log('setProcurementStatus: Procurement status update completed', {
    orderId,
    newStatus,
    isComplete,
    toUser: orderData.requesterUid,
    orderNo: orderData.orderNo
  });
}

// Set order status (for procurement)
export async function setOrderStatus(orderId: string, status: Order['status']) {
  console.log('setOrderStatus: Updating order status', {
    orderId,
    status
  });

  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status: status,
    updatedAt: serverTimestamp()
  });

  // Create notification for the requester
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) {
    console.error('setOrderStatus: Order not found after update');
    return;
  }
  
  const orderData = orderSnap.data();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('setOrderStatus: No current user');
    return;
  }

  await createNotification({
    title: 'สถานะใบสั่งซื้อมีการเปลี่ยนแปลง',
    message: `ใบสั่งซื้อ #${orderData.orderNo} อัปเดตสถานะเป็น ${getStatusLabel(status)}`,
    orderId: orderId,
    orderNo: orderData.orderNo || 0,
    kind: 'status_update',
    toUserUid: orderData.requesterUid,
    fromUserName: currentUser.displayName || 'ฝ่ายจัดซื้อ',
  });

  console.log('setOrderStatus: Order status update completed', {
    orderId,
    status,
    toUser: orderData.requesterUid,
    orderNo: orderData.orderNo
  });
}

// Update order items (for procurement - item-level tracking)
export async function updateOrderItems(orderId: string, updates: {
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
  items?: any[];
}) {
  console.log('updateOrderItems: Updating order items', {
    orderId,
    updates: Object.keys(updates)
  });

  const orderRef = doc(db, 'orders', orderId);
  const updateData: any = {
    updatedAt: serverTimestamp(),
    'timestamps.procurementUpdated': serverTimestamp(),
  };

  if (updates.itemsCategories) {
    updateData.itemsCategories = updates.itemsCategories;
  }
  if (updates.itemsStatuses) {
    updateData.itemsStatuses = updates.itemsStatuses;
  }
  if (updates.items) {
    updateData.items = updates.items;
  }

  await updateDoc(orderRef, updateData);
  console.log('updateOrderItems: Items updated successfully');
}

// ---------- Utility Functions ----------

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

// Get item type color for UI
export const getItemTypeColor = (itemType: ItemType): string => {
  switch (itemType) {
    case 'วัตถุดิบ':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'เครื่องมือ':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'วัสดุสิ้นเปลือง':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Software':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Get status color for UI
export const getStatusColor = (status: Order['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'delivered':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('th-TH') + ' บาท';
};

// Calculate order statistics
export const getOrderStats = (orders: Order[]) => {
  const total = orders.length;
  const pending = orders.filter(o => o.status === 'pending').length;
  const approved = orders.filter(o => o.status === 'approved').length;
  const rejected = orders.filter(o => o.status === 'rejected').length;
  const inProgress = orders.filter(o => o.status === 'in_progress').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    total,
    pending,
    approved,
    rejected,
    inProgress,
    delivered,
    totalAmount,
  };
};