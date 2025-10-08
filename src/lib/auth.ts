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
import type { UserRole } from '../types';

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

export async function getIdToken(): Promise<string | null> {
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

export async function setAuthCookie() {
  const idToken = await getIdToken();
  if (!idToken) return;
  
  if (typeof document !== 'undefined') {
    document.cookie = `firebase-id-token=${idToken}; path=/; max-age=3600; secure; samesite=strict`;
  }
}

export async function signOutUser() {
  await signOut(auth);
  
  if (typeof document !== 'undefined') {
    document.cookie = `firebase-id-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    import('astro:transitions/client')
      .then(({ navigate }) => navigate('/login'))
      .catch(() => {
        window.location.href = '/login';
      });
  }
}


export function subscribeAuthAndRole(
  cb: (user: User | null, role: UserRole | null) => void
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
        const role = (snap.data()?.role ?? 'buyer') as UserRole;
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