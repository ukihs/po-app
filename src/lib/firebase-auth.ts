import { serverAuth, serverDb } from '../firebase/server';
import type { AuthUser } from '../types';

export type { AuthUser };

export async function verifyFirebaseToken(idToken: string): Promise<AuthUser | null> {
  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken);
    const userDoc = await serverDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      console.warn(`User document not found for UID: ${decodedToken.uid}`);
      return null;
    }

    const userData = userDoc.data();
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: userData?.displayName || '',
      role: userData?.role || 'employee',
      emailVerified: decodedToken.email_verified || false
    };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

export function extractIdTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/Bearer\s+(.+)/);
  return match ? match[1] : null;
}

export function extractIdTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/firebase-id-token=([^;]+)/);
  return match ? match[1] : null;
}
