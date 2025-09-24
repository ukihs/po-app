import type { APIRoute } from 'astro';
import { createServerSession, destroyServerSession } from '../../../lib/server-session';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return new Response(JSON.stringify({
        error: 'Missing ID token',
        message: 'ID token is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // สร้าง server-side session
    const sessionId = await createServerSession(idToken);
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      message: 'Session created successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'Missing session ID',
        message: 'Session ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ลบ server-side session
    destroyServerSession(sessionId);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Session destroyed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to destroy session',
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
