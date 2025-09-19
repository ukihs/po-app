import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { serverAuth, serverDb } = await import('../../../firebase/server');
    const userData = await request.json();
    
    if (!userData.email) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        message: 'Email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
    
    
    return new Response(JSON.stringify({
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
      },
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    
    return new Response(JSON.stringify({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};