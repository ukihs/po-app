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
      email: userData.email,
      emailVerified: userData.emailVerified || false,
      disabled: userData.disabled || false
    };
    
    if (userData.displayName) createUserData.displayName = userData.displayName;
    if (userData.phoneNumber) createUserData.phoneNumber = userData.phoneNumber;
    if (userData.photoURL) createUserData.photoURL = userData.photoURL;
    if (userData.password) createUserData.password = userData.password;
    
    const userRecord = await serverAuth.createUser(createUserData);
    
    const userRole = userData.customClaims?.role || userData.role || 'buyer';
    await serverDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email || '',
      displayName: userRecord.displayName || '',
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return createSuccessResponse({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        phoneNumber: userRecord.phoneNumber,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime
        },
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