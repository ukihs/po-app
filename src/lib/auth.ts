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

// Optimized: Only write if document doesn't exist
export async function ensureUserDoc(user: User, displayName?: string) {
  const ref = doc(db, 'users', user.uid);
  const existingDoc = await getDoc(ref);
  
  // Only create if doesn't exist (no unnecessary writes)
  if (!existingDoc.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: displayName ?? user.displayName ?? (user.email?.split('@')[0] ?? ''),
      role: 'employee',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('[Auth] Created new user document for:', user.uid);
  }
  // Don't update on every login - saves Firestore writes!
}

export async function signUp(email: string, password: string, displayName?: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(user, { displayName });
  await ensureUserDoc(user, displayName);
  return user;
}

// Optimized: Don't check on every login
export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  // ensureUserDoc will be called by subscribeAuthAndRole if needed
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

export async function setAuthCookie(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    // Force refresh token if needed
    const idToken = await user.getIdToken(forceRefresh);
    
    if (typeof document !== 'undefined') {
      document.cookie = `firebase-id-token=${idToken}; path=/; max-age=3600; secure; samesite=strict`;
    }
  } catch (error) {
    console.error('Failed to set auth cookie:', error);
  }
}

// Auto-refresh token every 50 minutes (before 1 hour expiry)
let tokenRefreshInterval: NodeJS.Timeout | null = null;

export function startTokenRefresh() {
  // Clear existing interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }
  
  // Refresh token every 50 minutes
  tokenRefreshInterval = setInterval(async () => {
    const user = auth.currentUser;
    if (user) {
      console.log('[Auth] Auto-refreshing token...');
      await setAuthCookie(true); // Force refresh
    }
  }, 50 * 60 * 1000); // 50 minutes
}

export function stopTokenRefresh() {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
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


// Optimized: Use custom claims instead of Firestore listener
export function subscribeAuthAndRole(
  cb: (user: User | null, role: UserRole | null) => void
) {
  const offAuth = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      cb(null, null);
      return;
    }

    try {
      // Get role from custom claims (no Firestore read!)
      const tokenResult = await user.getIdTokenResult();
      let role = tokenResult.claims.role as UserRole | undefined;
      
      // Fallback: If no custom claim, read from Firestore once
      if (!role) {
        console.log('[Auth] No custom claim found, reading from Firestore...');
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          role = (snap.data()?.role ?? 'employee') as UserRole;
        } else {
          // Create user doc if not exists
          await ensureUserDoc(user);
          role = 'employee';
        }
      }
      
      cb(user, role);
      
      // Start token refresh
      startTokenRefresh();
    } catch (error) {
      console.error('Auth subscription error:', error);
      cb(user, null);
    }
  });

  return () => {
    stopTokenRefresh();
    offAuth();
  };
}