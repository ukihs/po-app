import type { APIRoute } from 'astro';
import { verifyApiAuth, createUnauthorizedResponse, createForbiddenResponse, hasApiRole } from '../../../../lib/api-auth';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const user = await verifyApiAuth(request);
    if (!user) {
      return createUnauthorizedResponse('Authentication required');
    }

    if (!hasApiRole(user, 'admin')) {
      return createForbiddenResponse('Access denied. Admin role required');
    }

    const { serverAuth } = await import('../../../../firebase/server');
    const { uid } = params;
    
    if (!uid) {
      return new Response(JSON.stringify({
        error: 'Missing user ID',
        message: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return new Response(JSON.stringify({
        error: 'Invalid password',
        message: 'Password is required and must be a string'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({
        error: 'Password too short',
        message: 'Password must be at least 6 characters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await serverAuth.updateUser(uid, {
      password: password
    });

    console.log(`Password reset successfully for user: ${uid}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Password reset successfully',
      uid: uid
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to reset password:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to reset password',
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};