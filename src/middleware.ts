import { defineMiddleware } from 'astro:middleware';
import { validateServerSession } from './lib/server-session';
import { PROTECTED_ROUTES, ROLE_PERMISSIONS, COOKIE_NAMES } from './lib/constants';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return next();
  }

  const sessionId = cookies.get(COOKIE_NAMES.SESSION_ID)?.value;
  
  if (!sessionId) {
    return redirect('/login');
  }

  try {
    const user = validateServerSession(sessionId);
    
    if (!user) {
      cookies.delete(COOKIE_NAMES.SESSION_ID, { path: '/' });
      return redirect('/login');
    }
    
    const allowedRoles = ROLE_PERMISSIONS[pathname as keyof typeof ROLE_PERMISSIONS];
    
    if (!allowedRoles || !allowedRoles.includes(user.role)) {
      return redirect('/unauthorized');
    }

    (context.locals as any).user = user;
    
  } catch (error) {
    console.error(`[Auth] Session validation failed for ${pathname}:`, error);
    cookies.delete(COOKIE_NAMES.SESSION_ID, { path: '/' });
    return redirect('/login');
  }

  return next();
});