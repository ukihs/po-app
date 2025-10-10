import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // ✅ Middleware already verified auth & admin role
    const user = locals.user; // Type-safe!

    const { serverAuth, serverDb } = await import('../../../firebase/server');
    const userData = await request.json();
    
    if (!userData.email) {
      return new Response(JSON.stringify({ 
        error: 'Email is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const createUserData: any = {
      email: userData.email
    };
    
    if (userData.displayName) createUserData.displayName = userData.displayName;
    if (userData.password) createUserData.password = userData.password;
    
    const userRecord = await serverAuth.createUser(createUserData);
    
          const userRole = userData.role || 'employee';
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
          
          // ✅ Set custom claims (Firebase standard way)
          try {
            await serverAuth.setCustomUserClaims(userRecord.uid, {
              role: userRole,
              name: userRecord.displayName || ''
            });
            console.log(`[Auth] Custom claims set for new user ${userRecord.uid}: role=${userRole}`);
          } catch (claimsError) {
            console.error('Failed to set custom claims for new user:', claimsError);
          }
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: userRole
      }
    }, null, 2), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};