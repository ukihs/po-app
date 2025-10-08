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
      role: userRole
    };
    
    return new Response(JSON.stringify({ user: userData }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'User not found',
      message: error instanceof Error ? error.message : String(error)
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
    
    const allowedFields = ['email', 'firstName', 'lastName', 'displayName', 'supervisorName', 'supervisorUid', 'department'];
    const sanitizedData: any = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }
    
    const updatedUser = await serverAuth.updateUser(uid, sanitizedData);
    
    if (updateData.role) {
      const newRole = updateData.role;
      const userDocRef = serverDb.collection('users').doc(uid);
      
      try {
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          await userDocRef.update({
            role: newRole,
            email: updatedUser.email || '',
            firstName: updateData.firstName || '',
            lastName: updateData.lastName || '',
            displayName: updatedUser.displayName || '',
            supervisorName: updateData.supervisorName || null,
            supervisorUid: updateData.supervisorUid || null,
            department: updateData.department || null,
            updatedAt: new Date()
          });
        } else {
          await userDocRef.set({
            uid: uid,
            email: updatedUser.email || '',
            firstName: updateData.firstName || '',
            lastName: updateData.lastName || '',
            displayName: updatedUser.displayName || '',
            role: newRole,
            supervisorName: updateData.supervisorName || null,
            supervisorUid: updateData.supervisorUid || null,
            department: updateData.department || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        } catch (error) {
        }
      }
    
    if (updateData.displayName && updateData.role === 'supervisor') {
      try {
        const subordinatesQuery = serverDb.collection('users')
          .where('supervisorUid', '==', uid);
        
        const subordinatesSnapshot = await subordinatesQuery.get();
        
        if (!subordinatesSnapshot.empty) {
          const batch = serverDb.batch();
          
          subordinatesSnapshot.forEach((doc) => {
            const subordinateRef = serverDb.collection('users').doc(doc.id);
            batch.update(subordinateRef, {
              supervisorName: updateData.displayName,
              updatedAt: new Date()
            });
          });
          
          await batch.commit();
          console.log(`Updated ${subordinatesSnapshot.size} subordinates with new supervisor name: ${updateData.displayName}`);
        }
      } catch (error) {
        console.error('Error updating subordinates supervisor name:', error);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updateData.role || 'buyer'
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function deleteDocumentsInBatch(serverDb: any, query: any, collectionName: string, uid: string): Promise<number> {
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return 0;
  }
  
  const batchSize = 500;
  const docs = snapshot.docs;
  let deletedCount = 0;
  
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = serverDb.batch();
    const batchDocs = docs.slice(i, i + batchSize);
    
    batchDocs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    deletedCount += batchDocs.length;
  }
  
  console.log(`Deleted ${deletedCount} documents from ${collectionName} for user ${uid}`);
  return deletedCount;
}

async function updateSubordinates(serverDb: any, uid: string): Promise<number> {
  const subordinatesQuery = serverDb.collection('users')
    .where('supervisorUid', '==', uid);
  const subordinatesSnapshot = await subordinatesQuery.get();
  
  if (subordinatesSnapshot.empty) {
    return 0;
  }
  
  const batch = serverDb.batch();
  subordinatesSnapshot.forEach((doc: any) => {
    batch.update(doc.ref, {
      supervisorName: null,
      supervisorUid: null,
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
  console.log(`Updated ${subordinatesSnapshot.size} subordinates to remove supervisor ${uid}`);
  return subordinatesSnapshot.size;
}

async function getRelatedDataQueries(serverDb: any, uid: string) {
  const ordersQuery = serverDb.collection('orders').where('requesterUid', '==', uid);
  const toNotificationsQuery = serverDb.collection('notifications').where('toUserUid', '==', uid);
  const fromNotificationsQuery = serverDb.collection('notifications').where('fromUserUid', '==', uid);
  const subordinatesQuery = serverDb.collection('users').where('supervisorUid', '==', uid);
  
  return {
    ordersQuery,
    toNotificationsQuery,
    fromNotificationsQuery,
    subordinatesQuery
  };
}

export const DELETE: APIRoute = async ({ request, params }) => {
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
    
    // Prevent self-deletion
    if (user.uid === uid) {
      return new Response(JSON.stringify({
        error: 'Self-deletion not allowed',
        message: 'ไม่สามารถลบบัญชีตัวเองได้ กรุณาติดต่อผู้ดูแลระบบคนอื่น'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!uid) {
      return new Response(JSON.stringify({
        error: 'Missing user ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Deleting user ${uid} and related data...`);
    
    const { ordersQuery, toNotificationsQuery, fromNotificationsQuery, subordinatesQuery } = 
      await getRelatedDataQueries(serverDb, uid);
    
    const [ordersSnapshot, toNotificationsSnapshot, fromNotificationsSnapshot, subordinatesSnapshot] = 
      await Promise.all([
        ordersQuery.get(),
        toNotificationsQuery.get(),
        fromNotificationsQuery.get(),
        subordinatesQuery.get()
      ]);
    
    const result = await serverDb.runTransaction(async (transaction: any) => {
      let totalDeleted = 0;
      
      try {
        const userDocRef = serverDb.collection('users').doc(uid);
        transaction.delete(userDocRef);
        console.log(`Marked user document for deletion: ${uid}`);
      } catch (firestoreError) {
        console.error('Error marking user for deletion:', firestoreError);
        throw firestoreError;
      }
      
      if (!ordersSnapshot.empty) {
        ordersSnapshot.forEach((doc: any) => {
          transaction.delete(doc.ref);
        });
        totalDeleted += ordersSnapshot.size;
        console.log(`Marked ${ordersSnapshot.size} orders for deletion`);
      }
      
      if (!toNotificationsSnapshot.empty) {
        toNotificationsSnapshot.forEach((doc: any) => {
          transaction.delete(doc.ref);
        });
        totalDeleted += toNotificationsSnapshot.size;
        console.log(`Marked ${toNotificationsSnapshot.size} notifications (to user) for deletion`);
      }
      
      if (!fromNotificationsSnapshot.empty) {
        fromNotificationsSnapshot.forEach((doc: any) => {
          transaction.delete(doc.ref);
        });
        totalDeleted += fromNotificationsSnapshot.size;
        console.log(`Marked ${fromNotificationsSnapshot.size} notifications (from user) for deletion`);
      }
      
      if (!subordinatesSnapshot.empty) {
        subordinatesSnapshot.forEach((doc: any) => {
          transaction.update(doc.ref, {
            supervisorName: null,
            supervisorUid: null,
            updatedAt: new Date()
          });
        });
        console.log(`Marked ${subordinatesSnapshot.size} subordinates for update`);
      }
      
      return { totalDeleted, subordinatesCount: subordinatesSnapshot.size };
    });
    
    console.log(`Transaction completed: ${result.totalDeleted} documents deleted, ${result.subordinatesCount} subordinates updated`);
    
    try {
      await serverAuth.deleteUser(uid);
      console.log(`Deleted user from Firebase Authentication: ${uid}`);
    } catch (authError) {
      console.error('Error deleting user from Firebase Authentication:', authError);
      throw new Error('User deleted from Firestore but failed to delete from Authentication. Manual cleanup may be required.');
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User and related data deleted successfully',
      uid,
      deletedCount: result.totalDeleted,
      updatedSubordinates: result.subordinatesCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Failed to delete user:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};