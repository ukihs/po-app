import { defineMiddleware } from 'astro:middleware';
import { verifyFirebaseToken, extractIdTokenFromHeader, extractIdTokenFromCookie } from './lib/firebase-auth';
import { PROTECTED_ROUTES, ROLE_PERMISSIONS, hasRole } from './lib/constants';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect } = context;
  const pathname = url.pathname;

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
    const user = await verifyFirebaseToken(idToken);
    
    if (!user) {
      return redirect('/login');
    }
    
    const allowedRoles = ROLE_PERMISSIONS[pathname as keyof typeof ROLE_PERMISSIONS];
    
    if (!allowedRoles || !hasRole(user.role, allowedRoles)) {
      return redirect('/unauthorized');
    }

    (context.locals as any).user = user;
    
  } catch (error) {
    console.error(`[Auth] Token verification failed for ${pathname}:`, error);
    return redirect('/login');
  }

  return next();
});