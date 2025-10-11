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
}

export async function signUp(email: string, password: string, displayName?: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(user, { displayName });
  await ensureUserDoc(user, displayName);
  return user;
}

export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
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
    const idToken = await user.getIdToken(forceRefresh);
    
    if (typeof document !== 'undefined') {
      document.cookie = `firebase-id-token=${idToken}; path=/; max-age=3600; secure; samesite=strict`;
    }
  } catch (error) {
    console.error('Failed to set auth cookie:', error);
  }
}

let tokenRefreshInterval: NodeJS.Timeout | null = null;

export function startTokenRefresh() {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }
  
  tokenRefreshInterval = setInterval(async () => {
    const user = auth.currentUser;
    if (user) {
      console.log('[Auth] Auto-refreshing token...');
      await setAuthCookie(true);
    }
  }, 50 * 60 * 1000);
}

export function stopTokenRefresh() {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
}

function clearAuthStorage() {
  if (typeof document !== 'undefined') {
    document.cookie = `firebase-id-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('[Auth] Failed to clear sessionStorage:', error);
    }
  }
}

async function navigateToLogin() {
  if (typeof window === 'undefined') return;
  
  try {
    const { navigate } = await import('astro:transitions/client');
    await navigate('/login');
  } catch (error) {
    console.warn('[Auth] Astro navigation failed, using window.location:', error);
    window.location.href = '/login';
  }
}

export async function signOutUser() {
  try {
    console.log('[Auth] Starting logout process...');
    
    stopTokenRefresh();
    
    try {
      const { useAuthStore } = await import('../stores/authStore');
      const { useOrdersStore } = await import('../stores/ordersStore');
      const { useNotificationsStore } = await import('../stores/notificationsStore');
      
      useAuthStore.getState().cleanup();
      useOrdersStore.getState().cleanup();
      useNotificationsStore.getState().cleanup();
      
      useAuthStore.getState().logout();
      useOrdersStore.getState().setOrders([]);
      useNotificationsStore.getState().setNotifications([]);
      
      console.log('[Auth] Stores cleaned up');
    } catch (storeError) {
      console.error('[Auth] Store cleanup error:', storeError);
    }
    
    await signOut(auth);
    console.log('[Auth] Firebase sign out completed');
    
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    stopTokenRefresh();
  } finally {
    clearAuthStorage();
    console.log('[Auth] Storage cleared');
    
    await navigateToLogin();
    console.log('[Auth] Redirected to login');
  }
}


export function subscribeAuthAndRole(
  cb: (user: User | null, role: UserRole | null) => void
) {
  const offAuth = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      cb(null, null);
      return;
    }

    try {
      const tokenResult = await user.getIdTokenResult();
      let role = tokenResult.claims.role as UserRole | undefined;
      
      if (!role) {
        console.log('[Auth] No custom claim found, reading from Firestore...');
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          role = (snap.data()?.role ?? 'employee') as UserRole;
        } else {
          await ensureUserDoc(user);
          role = 'employee';
        }
      }
      
      cb(user, role);
      
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