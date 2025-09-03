// src/lib/auth.ts
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

type Role = 'buyer' | 'supervisor' | 'procurement';

// สร้าง/อัปเดตข้อมูลผู้ใช้ใน Firestore (ตั้งค่า role เริ่มต้น = buyer)
export async function ensureUserDoc(user: User, displayName?: string) {
  const ref = doc(db, 'users', user.uid);
  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? '',
      displayName: displayName ?? user.displayName ?? (user.email?.split('@')[0] ?? ''),
      role: 'buyer',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// สมัครสมาชิก
export async function signUp(email: string, password: string, displayName?: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(user, { displayName });
  await ensureUserDoc(user, displayName);
  return user;
}

// ล็อกอิน
export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(user);
  return user;
}

// ออกจากระบบ
export async function signOutUser() {
  await signOut(auth);
}

// subscribe ทั้ง auth + role จาก /users/{uid}
export function subscribeAuthAndRole(
  cb: (user: User | null, role: Role | null) => void
) {
  let offUserDoc: (() => void) | null = null;

  const offAuth = onAuthStateChanged(auth, (user) => {
    if (offUserDoc) {
      offUserDoc();
      offUserDoc = null;
    }
    if (!user) {
      cb(null, null);
      return;
    }

    // เผื่อข้อมูลผู้ใช้ยังไม่ถูกสร้าง
    ensureUserDoc(user).catch(() => {});
    const ref = doc(db, 'users', user.uid);
    offUserDoc = onSnapshot(ref, (snap) => {
      const role = (snap.data()?.role ?? 'buyer') as Role;
      cb(user, role);
    });
  });

  return () => {
    if (offUserDoc) offUserDoc();
    offAuth();
  };
}
