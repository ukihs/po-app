import type { APIRoute } from 'astro';
import { validateSuperadminAccess, createErrorResponse, createSuccessResponse } from '../../../lib/users-api-helpers';

export const POST: APIRoute = async ({ request }) => {
  try {
    const authResult = await validateSuperadminAccess(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { serverAuth, serverDb } = await import('../../../firebase/server');
    const userData = await request.json();
    
    if (!userData.email) {
      return createErrorResponse('Email is required', 400);
    }
    
    const createUserData: any = {
      email: userData.email
    };
    
    if (userData.displayName) createUserData.displayName = userData.displayName;
    if (userData.password) createUserData.password = userData.password;
    
    const userRecord = await serverAuth.createUser(createUserData);
    
    const userRole = userData.role || 'buyer';
    await serverDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      displayName: userRecord.displayName || '',
      role: userRole,
      supervisorName: userData.supervisorName || null,
      supervisorUid: userData.supervisorUid || null,
      department: userData.department || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return createSuccessResponse({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: userRole
      }
    }, 201);
    
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create user',
      500
    );
  }
};