import type { APIRoute } from 'astro';
import { verifyFirebaseToken } from '../../../lib/firebase-auth';

const COOKIE_NAME = 'firebase-id-token';
const MAX_AGE_SECONDS = 60 * 60;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing idToken payload' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const user = await verifyFirebaseToken(idToken);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    cookies.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: MAX_AGE_SECONDS,
      path: '/',
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[Auth Session] Failed to set cookie:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to establish session',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
