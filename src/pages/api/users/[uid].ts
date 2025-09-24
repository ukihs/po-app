import type { APIRoute } from 'astro';
import { verifyApiAuth, createUnauthorizedResponse, createForbiddenResponse, hasApiRole } from '../../../lib/api-auth';

export const GET: APIRoute = async ({ request, params }) => {
  try {
    const user = await verifyApiAuth(request);
    if (!user) {
      return createUnauthorizedResponse('Authentication required');
    }

    if (!hasApiRole(user, 'superadmin')) {
      return createForbiddenResponse('Access denied. Superadmin role required');
    }

    const { serverAuth, serverDb } = await import('../../../firebase/server');
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
    
    const userRecord = await serverAuth.getUser(uid);
    
    let userRole = 'buyer';
    try {
      const userDocRef = serverDb.collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        userRole = userDoc.data()?.role || 'buyer';
      }
    } catch (error) {
    }
    
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      phoneNumber: userRecord.phoneNumber,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        lastRefreshTime: userRecord.metadata.lastRefreshTime
      },
      customClaims: userRecord.customClaims || {},
      role: userRole
    };
    
    return new Response(JSON.stringify({ user: userData, timestamp: new Date().toISOString() }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'User not found',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const user = await verifyApiAuth(request);
    if (!user) {
      return createUnauthorizedResponse('Authentication required');
    }

    if (!hasApiRole(user, 'superadmin')) {
      return createForbiddenResponse('Access denied. Superadmin role required');
    }

    const { serverAuth, serverDb } = await import('../../../firebase/server');
    const { uid } = params;
    
    if (!uid) {
      return new Response(JSON.stringify({
        error: 'Missing user ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updateData = await request.json();
    
    const allowedFields = ['email', 'displayName', 'phoneNumber', 'photoURL', 'disabled', 'emailVerified'];
    const sanitizedData: any = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }
    
    const updatedUser = await serverAuth.updateUser(uid, sanitizedData);
    
    if (updateData.customClaims?.role || updateData.role) {
      const newRole = updateData.customClaims?.role || updateData.role;
      const userDocRef = serverDb.collection('users').doc(uid);
      
      try {
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          await userDocRef.update({
            role: newRole,
            email: updatedUser.email || '',
            displayName: updatedUser.displayName || '',
            updatedAt: new Date()
          });
        } else {
          await userDocRef.set({
            uid: uid,
            email: updatedUser.email || '',
            displayName: updatedUser.displayName || '',
            role: newRole,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        } catch (error) {
        }
      }
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        phoneNumber: updatedUser.phoneNumber,
        emailVerified: updatedUser.emailVerified,
        disabled: updatedUser.disabled,
        role: updateData.customClaims?.role || updateData.role || 'buyer'
      },
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const user = await verifyApiAuth(request);
    if (!user) {
      return createUnauthorizedResponse('Authentication required');
    }

    if (!hasApiRole(user, 'superadmin')) {
      return createForbiddenResponse('Access denied. Superadmin role required');
    }

    const { serverAuth } = await import('../../../firebase/server');
    const { uid } = params;
    
    if (!uid) {
      return new Response(JSON.stringify({
        error: 'Missing user ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await serverAuth.deleteUser(uid);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User deleted successfully',
      uid,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};