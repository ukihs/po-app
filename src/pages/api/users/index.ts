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
    
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const search = searchParams.get('search') || '';
    const sortOrder = searchParams.get('sort') || 'desc';
    
    const maxResults = limit;
    const nextPageToken = searchParams.get('nextPageToken') || undefined;
    
    let allUsers: any[] = [];
    let currentPageToken: string | undefined = undefined;
    let pageCount = 0;
    
    do {
      pageCount++;
      const listUsersResult = await serverAuth.listUsers(1000, currentPageToken);
      allUsers.push(...listUsersResult.users);
      currentPageToken = listUsersResult.pageToken;
    } while (currentPageToken);
    
    let filteredUsers = allUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = allUsers.filter(user => 
        user.uid.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.phoneNumber?.includes(search)
      );
    }
    
    const sortedUsers = filteredUsers.sort((a, b) => {
      const dateA = a.metadata?.creationTime ? new Date(a.metadata.creationTime).getTime() : 0;
      const dateB = b.metadata?.creationTime ? new Date(b.metadata.creationTime).getTime() : 0;
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    
    const totalUsers = sortedUsers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
    
    const userRoles: Record<string, string> = {};
    
    const userDocs = await Promise.allSettled(
      paginatedUsers.map(async (user) => {
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
        userRoles[result.value.uid] = result.value.data.role || 'buyer';
      }
    });
    
    const users = paginatedUsers.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
        lastRefreshTime: user.metadata.lastRefreshTime
      },
      customClaims: user.customClaims || {},
      role: userRoles[user.uid] || 'buyer'
    }));
    
    const response = {
      users,
      pagination: {
        currentPage: page,
        limit: limit,
        totalUsers: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasNextPage: endIndex < totalUsers,
        hasPreviousPage: page > 1,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalUsers)
      },
      search: search || null,
      timestamp: new Date().toISOString()
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
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};