// src/lib/notify.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/client';

export type AppRole = 'buyer' | 'supervisor' | 'procurement';

const recipientsForUid = (uid: string) => `uid_${uid}`;
const recipientsForRole = (role: AppRole) => `role_${role}`;

type PushNotifInput = {
  title: string;
  body: string;
  orderId?: string | null;
  toUids?: string[];
  toRoles?: AppRole[];
};

/**
 * บันทึกแจ้งเตือนไปยัง Firestore
 * doc รูปแบบ:
 * {
 *   recipients: ['uid_xxx', 'role_supervisor', ...],
 *   title, body, orderId, createdAt, readBy:[]
 * }
 */
export async function pushNotification(input: PushNotifInput) {
  const recips = [
    ...(input.toUids ?? []).map(recipientsForUid),
    ...(input.toRoles ?? []).map(recipientsForRole),
  ];

  if (recips.length === 0) throw new Error('ต้องระบุผู้รับ (uid/role) อย่างน้อย 1 ราย');

  await addDoc(collection(db, 'notifications'), {
    recipients: recips,
    title: input.title,
    body: input.body,
    orderId: input.orderId ?? null,
    readBy: [],
    createdAt: serverTimestamp(),
  });
}

/** ยิงแจ้งเตือนตอนผู้ซื้อส่งคำขอสั่งซื้อ -> หัวหน้างาน */
export async function notifyOrderSubmitted(opts: {
  orderId: string;
  requesterName: string;
}) {
  await pushNotification({
    title: 'คำขอสั่งซื้อใหม่',
    body: `${opts.requesterName} ส่งคำขอสั่งซื้อ #${opts.orderId}`,
    orderId: opts.orderId,
    toRoles: ['supervisor'], // หัวหน้างานเห็น
  });
}
