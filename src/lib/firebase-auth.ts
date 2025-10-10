import { serverAuth, serverDb } from '../firebase/server';
import type { AuthUser, UserRole } from '../types';

export type { AuthUser };

export async function verifyFirebaseToken(idToken: string): Promise<AuthUser | null> {
  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken);
    
    let role = decodedToken.role as UserRole | undefined;
    let displayName = decodedToken.name as string | undefined;
    
    if (!role) {
      console.log('[Auth Server] No custom claim, reading from Firestore...');
      const userDoc = await serverDb.collection('users').doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        console.warn(`User document not found for UID: ${decodedToken.uid}`);
        return null;
      }

      const userData = userDoc.data();
      role = (userData?.role as UserRole) || 'employee';
      displayName = userData?.displayName || '';
      
      serverAuth.setCustomUserClaims(decodedToken.uid, { 
        role,
        name: displayName
      }).catch(err => console.error('Failed to set custom claims:', err));
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: displayName || decodedToken.email?.split('@')[0] || '',
      role: (role || 'employee') as UserRole,
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