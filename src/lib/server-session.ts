import { serverAuth, serverDb } from '../firebase/server';
import type { UserRole, AuthUser } from '../types';
import { SESSION_TIMEOUT_MS, SESSION_CLEANUP_INTERVAL_MS } from './constants';

export type { UserRole, AuthUser };

const sessionStore = new Map<string, {
  user: AuthUser;
  expiresAt: number;
  lastActivity: number;
}>();

export async function createServerSession(idToken: string): Promise<string> {
  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken);
    const userDoc = await serverDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    const user: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: userData?.displayName || '',
      role: userData?.role || 'buyer',
      emailVerified: decodedToken.email_verified || false
    };

    const sessionId = generateSessionId();
    const expiresAt = Date.now() + SESSION_TIMEOUT_MS;
    
    sessionStore.set(sessionId, {
      user,
      expiresAt,
      lastActivity: Date.now()
    });

    return sessionId;
  } catch (error) {
    console.error('Failed to create server session:', error);
    throw new Error('Invalid token');
  }
}

export function validateServerSession(sessionId: string): AuthUser | null {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId);
    return null;
  }

  session.lastActivity = Date.now();
  return session.user;
}

export function destroyServerSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(sessionId);
    }
  }
}

function generateSessionId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS);
