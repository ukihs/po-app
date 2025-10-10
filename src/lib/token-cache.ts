import type { AuthUser } from '../types';

interface CacheEntry {
  user: AuthUser;
  timestamp: number;
}

const tokenCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes


export function getCachedToken(token: string): AuthUser | null {
  const entry = tokenCache.get(token);
  
  if (!entry) {
    return null;
  }
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    tokenCache.delete(token);
    return null;
  }
  
  return entry.user;
}

export function cacheToken(token: string, user: AuthUser): void {
  tokenCache.set(token, {
    user,
    timestamp: Date.now()
  });
  
  if (tokenCache.size > 1000) {
    const entries = Array.from(tokenCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    for (let i = 0; i < 100; i++) {
      tokenCache.delete(entries[i][0]);
    }
  }
}

export function invalidateToken(token: string): void {
  tokenCache.delete(token);
}

export function clearTokenCache(): void {
  tokenCache.clear();
}

export function getCacheStats() {
  return {
    size: tokenCache.size,
    entries: Array.from(tokenCache.entries()).map(([token, entry]) => ({
      token: token.substring(0, 20) + '...',
      age: Date.now() - entry.timestamp,
      user: entry.user.email
    }))
  };
}