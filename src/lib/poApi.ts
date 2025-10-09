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
import { auth, db } from '../firebase/client';
import { sendOrderCreatedNotification, sendOrderApprovedNotification, sendOrderRejectedNotification } from './email-notifications';
import type { 
  ItemType, 
  ProcurementStatus, 
  OrderItemInput, 
  Order,
  CreateOrderPayload,
  OrderStatus
} from '../types';
import { 
  toNum, 
  calculateLineTotal,
  calculateGrandTotal,
  getItemCategory,
  getInitialProcurementStatus,
  getProcurementStatusDisplay,
  isProcurementComplete,
  generateOrderNumber
} from './order-utils';
import { COLLECTIONS } from './constants';


export type { 
  ItemType, 
  ProcurementStatus, 
  OrderItemInput as Item,
  Order,
  OrderStatus
};

export { 
  toNum,
  getItemCategory,
  getInitialProcurementStatus,
  getProcurementStatusDisplay,
  generateOrderNumber
};

export const lineTotal = (it: OrderItemInput) => calculateLineTotal(it.quantity, it.amount);
export const grandTotal = (items: OrderItemInput[]) => calculateGrandTotal(items);

async function getNextNumber(seqDocId = COLLECTIONS.ORDERS): Promise<number> {
  const ref = doc(db, COLLECTIONS.COUNTERS, seqDocId);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const last = (snap.exists() ? (snap.data() as any).last : 0) || 0;
    const n = last + 1;
    tx.set(ref, { last: n }, { merge: true });
    return n;
  });
  return next;
}

export async function createNotification(data: {
  title: string;
  message: string;
  orderId: string;
  orderNo: number;
  kind: 'approval_request' | 'approved' | 'rejected' | 'status_update';
  toUserUid?: string;
  forRole?: 'employee' | 'supervisor' | 'procurement';
  fromUserName?: string;
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return;
  }

  const recipients: Array<{ type: 'user' | 'role'; id: string }> = [];
  
  if (data.toUserUid) {
    recipients.push({ type: 'user', id: data.toUserUid });
  }
  
  if (data.forRole) {
    recipients.push({ type: 'role', id: data.forRole });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const notificationData = {
    title: data.title,
    message: data.message,
    orderId: data.orderId,
    orderNo: data.orderNo,
    kind: data.kind,
    recipients,
    readBy: [],
    fromUserUid: currentUser.uid,
    fromUserName: data.fromUserName || currentUser.displayName || 'ระบบ',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: expiresAt,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('createNotification: Error creating notification', error);
    throw error;
  }
}


export async function createOrder(payload: CreateOrderPayload) {
  const u = auth.currentUser;
  if (!u) throw new Error('ยังไม่ได้ล็อกอิน');

  try {
    const orderNo = await getNextNumber(COLLECTIONS.ORDERS);

    const cleanItems = payload.items.map((it) => ({
      description: (it.description || '').trim(),
      receivedDate: it.receivedDate || '',
      quantity: toNum(it.quantity),
      amount: toNum(it.amount),
      lineTotal: lineTotal(it),
      itemType: it.itemType || 'วัตถุดิบ',
    }));

    // Get user role to determine auto-approve behavior
    const userDocRef = doc(db, COLLECTIONS.USERS, u.uid);
    const userDoc = await getDoc(userDocRef);
    const userRole = userDoc.exists() ? userDoc.data()?.role : 'employee';

    // Procurement orders are auto-approved
    const shouldAutoApprove = userRole === 'procurement';
    const orderStatus = shouldAutoApprove ? 'approved' : 'pending';

    const docData: any = {
      requesterUid: u.uid,
      requesterName: payload.requesterName,
      date: payload.date,
      items: cleanItems,
      total: cleanItems.reduce((s, x) => s + x.lineTotal, 0),
      totalAmount: cleanItems.reduce((s, x) => s + x.lineTotal, 0),
      status: orderStatus,
      createdAt: serverTimestamp(),
      orderNo,
      timestamps: {
        submitted: serverTimestamp(),
      }
    };

    // Add approval info for auto-approved orders
    if (shouldAutoApprove) {
      docData.approvedBy = payload.requesterName;
      docData.approvedByUid = u.uid;
      docData.approvedAt = serverTimestamp();
      docData.timestamps.approved = serverTimestamp();
      docData.timestamps.procurementStarted = serverTimestamp();
    }

    const ref = await addDoc(collection(db, COLLECTIONS.ORDERS), docData);

    // Send notification only for employee orders (not supervisor/procurement)
    try {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const supervisorUid = userData.supervisorUid;
        const shouldNotify = 
          userRole === 'employee' && 
          supervisorUid && 
          supervisorUid !== u.uid;
        
        if (shouldNotify) {
          await createNotification({
            title: 'มีใบสั่งซื้อใหม่รออนุมัติ',
            message: `ใบสั่งซื้อ #${orderNo} โดย ${payload.requesterName} รอการอนุมัติ`,
            orderId: ref.id,
            orderNo,
            kind: 'approval_request',
            toUserUid: supervisorUid,
            fromUserName: payload.requesterName,
          });
          try {
            await sendOrderCreatedNotification(u.uid, ref.id, {
              orderNo,
              requesterName: payload.requesterName,
              date: payload.date,
              items: cleanItems,
              total: docData.total
            });
          } catch (emailError) {
            console.error('createOrder: Email notification failed', emailError);
          }
        }
      }
      
    } catch (notifError) {
      console.error('createOrder: Notification failed', notifError);
    }

    return ref.id;

  } catch (error) {
    console.error('createOrder: Failed', error);
    throw error;
  }
}

export function listenOrdersAll(callback: (orders: Order[]) => void) {
  const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
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

export function listenUserOrders(userUid: string, callback: (orders: Order[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.ORDERS), 
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

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const orderSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
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

export async function approveOrder(orderId: string, approved: boolean) {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const newStatus = approved ? 'approved' : 'rejected';

  const timestampUpdate = approved ? 
    { 'timestamps.approved': serverTimestamp() } : 
    { 'timestamps.rejected': serverTimestamp() };
  
  await updateDoc(orderRef, {
    status: newStatus,
    approvedAt: serverTimestamp(),
    approvedBy: auth.currentUser?.uid || '',
    approvedByUid: auth.currentUser?.uid || '',
    updatedAt: serverTimestamp(),
    ...timestampUpdate
  });

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

  try {
    await createNotification({
      title: approved ? 'ใบสั่งซื้อได้รับการอนุมัติ' : 'ใบสั่งซื้อไม่ได้รับการอนุมัติ',
      message: `ใบสั่งซื้อ #${orderData.orderNo} ${approved ? 'ได้รับการอนุมัติแล้ว' : 'ไม่ได้รับการอนุมัติ'}`,
      orderId: orderId,
      orderNo: orderData.orderNo || 0,
      kind: approved ? 'approved' : 'rejected',
      toUserUid: orderData.requesterUid,
      fromUserName: currentUser.displayName || 'หัวหน้างาน',
    });
  } catch (notifError) {
    console.error('approveOrder: Notification failed', notifError);
  }

  try {
    if (approved) {
      await sendOrderApprovedNotification(
        orderData.requesterUid,
        currentUser.uid,
        orderId
      );
    } else {
      await sendOrderRejectedNotification(
        orderData.requesterUid,
        currentUser.uid,
        orderId
      );
    }
  } catch (emailError) {
    console.error('approveOrder: Email notification failed', emailError);
  }

  if (approved) {
    try {
      await updateDoc(orderRef, {
        'timestamps.procurementStarted': serverTimestamp(),
        updatedAt: serverTimestamp()
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
    } catch (procurementError) {
      console.error('approveOrder: Procurement notification failed', procurementError);
    }
  }
}

export async function setProcurementStatus(orderId: string, newStatus: ProcurementStatus) {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  
  const isComplete = isProcurementComplete(newStatus);
  
  const updateData: any = {
    procurementStatus: newStatus,
    updatedAt: serverTimestamp(),
    'timestamps.procurementUpdated': serverTimestamp(),
  };

  if (isComplete) {
    updateData.status = 'delivered';
    updateData['timestamps.delivered'] = serverTimestamp();
  }

  await updateDoc(orderRef, updateData);

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
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  await updateDoc(orderRef, {
    status: status,
    updatedAt: serverTimestamp()
  });

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
}

export async function updateOrderItems(orderId: string, updates: {
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
  items?: any[];
}) {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
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
}

import { getStatusLabel } from './order-utils';

export { 
  getItemTypeColor,
  formatCurrency,
  getOrderStats,
  getStatusLabel
} from './order-utils';