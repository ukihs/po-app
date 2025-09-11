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
import { doc, onSnapshot, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

type Role = 'buyer' | 'supervisor' | 'procurement' | 'superadmin';

// สร้าง/อัปเดตข้อมูลผู้ใช้ใน Firestore (ไม่เขียนทับ role ที่มีอยู่)
export async function ensureUserDoc(user: User, displayName?: string) {
  const ref = doc(db, 'users', user.uid);
  
  // ตรวจสอบว่ามี document อยู่แล้วหรือไม่
  const existingDoc = await getDoc(ref);
  
  if (existingDoc.exists()) {
    // ถ้ามี document แล้ว อัปเดตเฉพาะ fields ที่จำเป็น (ไม่ทำ role)
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email ?? '',
        displayName: displayName ?? user.displayName ?? (user.email?.split('@')[0] ?? ''),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    // ถ้าไม่มี document สร้างใหม่พร้อม role เริ่มต้น
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: displayName ?? user.displayName ?? (user.email?.split('@')[0] ?? ''),
      role: 'buyer', // ตั้ง role เริ่มต้นเฉพาะตอนสร้างใหม่
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// สมัครสมาชิก
export async function signUp(email: string, password: string, displayName?: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(user, { displayName });
  await ensureUserDoc(user, displayName);
  return user;
}

// ล็อกอิน - ไม่เรียก ensureUserDoc เพื่อป้องกันการเขียนทับ role
export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  
  // เรียก ensureUserDoc เฉพาะเมื่อจำเป็น (เผื่อ user document หาย)
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await ensureUserDoc(user);
    }
  } catch (error) {
    console.warn('Failed to check/create user document:', error);
  }
  
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

    const ref = doc(db, 'users', user.uid);
    offUserDoc = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const role = (snap.data()?.role ?? 'buyer') as Role;
        console.log('Auth subscription - User:', user.email, 'Role:', role);
        cb(user, role);
      } else {
        console.warn('User document not found, creating...');
        // สร้าง document ถ้าไม่มี
        ensureUserDoc(user).then(() => {
          // หลังสร้างแล้วจะ trigger onSnapshot อีกครั้ง
        }).catch(console.error);
      }
    }, (error) => {
      console.error('Auth subscription error:', error);
      cb(user, null);
    });
  });

  return () => {
    if (offUserDoc) offUserDoc();
    offAuth();
  };
}