import { verifyApiAuth, createUnauthorizedResponse, createForbiddenResponse, hasApiRole } from './api-auth';

export async function validateSuperadminAccess(request: Request) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return { error: createUnauthorizedResponse('Authentication required') };
  }

  if (!hasApiRole(user, 'admin')) {
    return { error: createForbiddenResponse('Access denied. Superadmin role required') };
  }

  return { user };
}

export function createErrorResponse(message: string, status: number = 500) {
  return new Response(JSON.stringify({
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  }, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
