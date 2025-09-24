import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, db } from '../firebase/client';
import { doc, onSnapshot, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

type Role = 'buyer' | 'supervisor' | 'procurement' | 'superadmin';

export async function ensureUserDoc(user: User, displayName?: string) {
  const ref = doc(db, 'users', user.uid);
  const existingDoc = await getDoc(ref);
  
  if (existingDoc.exists()) {
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
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: displayName ?? user.displayName ?? (user.email?.split('@')[0] ?? ''),
      role: 'buyer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function signUp(email: string, password: string, displayName?: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(user, { displayName });
  await ensureUserDoc(user, displayName);
  return user;
}

export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  
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

export async function createAuthCookie() {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const idToken = await user.getIdToken();
    return idToken;
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
}

export async function signOutUser() {
  try {
    const sessionId = getCookieValue('session-id');
    if (sessionId) {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
    }
  } catch (error) {
    console.error('Failed to destroy server session:', error);
  }
  
  await signOut(auth);
  
  if (typeof document !== 'undefined') {
    document.cookie = 'session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

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
        cb(user, role);
      } else {
        ensureUserDoc(user).then(() => {
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