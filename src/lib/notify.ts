import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/client';

export type AppRole = 'employee' | 'supervisor' | 'procurement';

const recipientsForUid = (uid: string) => `uid_${uid}`;
const recipientsForRole = (role: AppRole) => `role_${role}`;

type PushNotifInput = {
  title: string;
  body: string;
  orderId?: string | null;
  toUids?: string[];
  toRoles?: AppRole[];
};
export async function pushNotification(input: PushNotifInput) {
  const recips = [
    ...(input.toUids ?? []).map(recipientsForUid),
    ...(input.toRoles ?? []).map(recipientsForRole),
  ];

  if (recips.length === 0) throw new Error('Must specify at least one recipient');

  await addDoc(collection(db, 'notifications'), {
    recipients: recips,
    title: input.title,
    body: input.body,
    orderId: input.orderId ?? null,
    readBy: [],
    createdAt: serverTimestamp(),
  });
}

export async function notifyOrderSubmitted(opts: {
  orderId: string;
  requesterName: string;
}) {
  await pushNotification({
    title: 'มีใบขอซื้อใหม่',
    body: `${opts.requesterName} ส่งคำขอสั่งซื้อ #${opts.orderId}`,
    orderId: opts.orderId,
    toRoles: ['supervisor'],
  });
}
