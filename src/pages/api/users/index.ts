import type { APIRoute } from 'astro';
import { verifyApiAuth, createUnauthorizedResponse, createForbiddenResponse, hasApiRole } from '../../../lib/api-auth';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const user = await verifyApiAuth(request);
    if (!user) {
      return createUnauthorizedResponse('Authentication required');
    }

    if (!hasApiRole(user, 'superadmin')) {
      return createForbiddenResponse('Access denied. Superadmin role required');
    }

    const { serverAuth, serverDb } = await import('../../../firebase/server');
    
    const listUsersResult = await serverAuth.listUsers(1000);
    const allUsers = listUsersResult.users;
    
    const userRoles: Record<string, string> = {};
    const userSupervisors: Record<string, { 
      firstName?: string; 
      lastName?: string; 
      supervisorName?: string; 
      supervisorUid?: string; 
      department?: string 
    }> = {};
    
    const userDocs = await Promise.allSettled(
      allUsers.map(async (user) => {
        try {
          const userDocRef = serverDb.collection('users').doc(user.uid);
          const userDoc = await userDocRef.get();
          return { uid: user.uid, data: userDoc.exists ? userDoc.data() : null };
        } catch (error) {
          return { uid: user.uid, data: null };
        }
      })
    );
    
    userDocs.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data) {
        const data = result.value.data;
        userRoles[result.value.uid] = data.role || 'buyer';
        userSupervisors[result.value.uid] = {
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          supervisorName: data.supervisorName || null,
          supervisorUid: data.supervisorUid || null,
          department: data.department || null
        };
      }
    });
    
    const users = allUsers.map(user => ({
      uid: user.uid,
      email: user.email,
      firstName: userSupervisors[user.uid]?.firstName || null,
      lastName: userSupervisors[user.uid]?.lastName || null,
      displayName: user.displayName,
      role: userRoles[user.uid] || 'buyer',
      supervisorName: userSupervisors[user.uid]?.supervisorName || null,
      supervisorUid: userSupervisors[user.uid]?.supervisorUid || null
    }));
    
    const response = {
      users
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : String(error)
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};