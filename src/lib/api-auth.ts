import { verifyFirebaseToken, extractIdTokenFromHeader, extractIdTokenFromCookie, type AuthUser } from './firebase-auth';

export async function verifyApiAuth(request: Request): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    const idToken = extractIdTokenFromHeader(authHeader) || extractIdTokenFromCookie(cookieHeader);
    
    if (!idToken) {
      return null;
    }

    return await verifyFirebaseToken(idToken);
  } catch (error) {
    console.error('API Auth verification failed:', error);
    return null;
  }
}

export function createUnauthorizedResponse(message: string = 'Unauthorized'): Response {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message,
    timestamp: new Date().toISOString()
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createForbiddenResponse(message: string = 'Forbidden'): Response {
  return new Response(JSON.stringify({
    error: 'Forbidden',
    message,
    timestamp: new Date().toISOString()
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function hasApiRole(user: AuthUser, requiredRoles: string | string[]): boolean {
  const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return allowedRoles.includes(user.role);
}

export function withAuth(
  handler: (context: { user: AuthUser; request: Request; params: any }) => Promise<Response>,
  requiredRoles?: string | string[]
) {
  return async (context: { request: Request; params: any }): Promise<Response> => {
    const user = await verifyApiAuth(context.request);
    
    if (!user) {
      return createUnauthorizedResponse('Authentication required');
    }

    if (requiredRoles && !hasApiRole(user, requiredRoles)) {
      return createForbiddenResponse(`Access denied. Required roles: ${Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}`);
    }

    return handler({ user, ...context });
  };
}
