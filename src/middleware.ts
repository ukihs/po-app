import { defineMiddleware } from 'astro:middleware';
import { validateServerSession } from './lib/server-session';

const PROTECTED_ROUTES = [
  '/orders/create',
  '/orders/tracking', 
  '/orders/notifications',
  '/orders/list',
  '/admin/users',
  '/admin/orders'
];

const ROLE_PERMISSIONS = {
  '/orders/create': ['buyer'],
  '/orders/tracking': ['buyer', 'supervisor', 'procurement'],
  '/orders/notifications': ['buyer', 'supervisor', 'procurement'],
  '/orders/list': ['supervisor', 'procurement'],
  '/admin/users': ['superadmin'],
  '/admin/orders': ['superadmin']
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return next();
  }

  const sessionId = cookies.get('session-id')?.value;
  
  if (!sessionId) {
    return redirect('/login');
  }

  try {
    const user = validateServerSession(sessionId);
    
    if (!user) {
      cookies.delete('session-id', { path: '/' });
      return redirect('/login');
    }
    
    const allowedRoles = ROLE_PERMISSIONS[pathname as keyof typeof ROLE_PERMISSIONS];
    
    if (!allowedRoles || !allowedRoles.includes(user.role)) {
      return redirect('/unauthorized');
    }

    (context.locals as any).user = user;
    
  } catch (error) {
    console.error(`[Auth] Session validation failed for ${pathname}:`, error);
    cookies.delete('session-id', { path: '/' });
    return redirect('/login');
  }

  return next();
});