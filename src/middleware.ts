import { defineMiddleware } from 'astro:middleware';
import { verifyFirebaseToken, extractIdTokenFromHeader, extractIdTokenFromCookie } from './lib/firebase-auth';
import { PROTECTED_ROUTES, ROLE_PERMISSIONS, hasRole } from './lib/constants';
import { getCachedToken, cacheToken } from './lib/token-cache';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect, locals } = context;
  const pathname = url.pathname;

  // Handle API routes separately
  if (pathname.startsWith('/api/')) {
    return handleAPIAuth(context, next);
  }

  // Handle page routes
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return next();
  }

  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  const idToken = extractIdTokenFromHeader(authHeader) || extractIdTokenFromCookie(cookieHeader);
  
  if (!idToken) {
    return redirect('/login');
  }

  try {
    // Check cache first (fast path)
    let user = getCachedToken(idToken);
    
    if (!user) {
      // Cache miss - verify token (slow path)
      user = await verifyFirebaseToken(idToken);
      
      if (!user) {
        return redirect('/login');
      }
      
      // Cache the verified token
      cacheToken(idToken, user);
    }
    
    const matchedPermission = Object.entries(ROLE_PERMISSIONS)
      .filter(([route]) => pathname === route || pathname.startsWith(route.endsWith('/') ? route : `${route}/`))
      .sort((a, b) => b[0].length - a[0].length)[0];

    const allowedRoles = matchedPermission?.[1];

    if (!allowedRoles || !hasRole(user.role, allowedRoles)) {
      return redirect('/unauthorized');
    }

    context.locals.user = user;
    
  } catch (error) {
    console.error(`[Auth] Token verification failed for ${pathname}:`, error);
    return redirect('/login');
  }

  return next();
});

// Handle API authentication
async function handleAPIAuth(context: any, next: any) {
  const { url, request, locals } = context;
  const pathname = url.pathname;

  if (pathname === '/api/auth/session') {
    return next();
  }

  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  const idToken = extractIdTokenFromHeader(authHeader) || extractIdTokenFromCookie(cookieHeader);
  
  if (!idToken) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      message: 'Authentication required'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let user = getCachedToken(idToken);
    
    if (!user) {
      user = await verifyFirebaseToken(idToken);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Invalid token'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      cacheToken(idToken, user);
    }

    // Set user in locals for API to use
    locals.user = user;

    // Check admin-only API routes
    const isAdminAPI = pathname.startsWith('/api/users/') && request.method !== 'GET';
    if (isAdminAPI && user.role !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: 'Admin access required'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error(`[API Auth] Token verification failed:`, error);
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      message: 'Authentication failed'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return next();
}
