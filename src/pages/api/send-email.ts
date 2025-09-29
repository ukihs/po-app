import type { APIRoute } from 'astro';
import { createEmailService } from '../../lib/email-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, data } = body;

    const emailService = createEmailService();
    let result = false;

    if (type === 'order-created') {
      const { requesterUid, orderId, orderNo, requesterName, date, items, total } = data;
      
      const { serverDb } = await import('../../firebase/server');
      
      const requesterDoc = await serverDb.collection('users').doc(requesterUid).get();
      if (!requesterDoc.exists) {
        throw new Error(`Requester not found: ${requesterUid}`);
      }
      const requesterData = requesterDoc.data();
      if (!requesterData) {
        throw new Error(`Requester data not found: ${requesterUid}`);
      }
      const requesterEmail = requesterData.email;
      
      const supervisorUid = requesterData.supervisorUid;
      if (!supervisorUid) {
        throw new Error(`Supervisor not found for requester: ${requesterUid}`);
      }
      
      const supervisorDoc = await serverDb.collection('users').doc(supervisorUid).get();
      if (!supervisorDoc.exists) {
        throw new Error(`Supervisor not found: ${supervisorUid}`);
      }
      const supervisorData = supervisorDoc.data();
      if (!supervisorData) {
        throw new Error(`Supervisor data not found: ${supervisorUid}`);
      }
      const supervisorEmail = supervisorData.email;
      const supervisorName = supervisorData.displayName || supervisorData.firstName + ' ' + supervisorData.lastName || 'หัวหน้างาน';
      
      result = await emailService.notifyOrderCreated({
        requesterName: requesterName || requesterData.displayName || requesterData.firstName + ' ' + requesterData.lastName || 'ผู้ขอซื้อ',
        requesterEmail,
        supervisorName,
        supervisorEmail,
        orderNo,
        date,
        items,
        total
      });
      console.log('Order created email sent:', result);

    } else if (type === 'order-approved') {
      const { requesterUid, supervisorUid, orderId } = data;
      
      const { serverDb } = await import('../../firebase/server');
      
      const orderDoc = await serverDb.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        throw new Error(`Order not found: ${orderId}`);
      }
      const orderData = orderDoc.data();
      if (!orderData) {
        throw new Error(`Order data not found: ${orderId}`);
      }
      
      const requesterDoc = await serverDb.collection('users').doc(requesterUid).get();
      if (!requesterDoc.exists) {
        throw new Error(`Requester not found: ${requesterUid}`);
      }
      const requesterData = requesterDoc.data();
      if (!requesterData) {
        throw new Error(`Requester data not found: ${requesterUid}`);
      }
      const requesterEmail = requesterData.email;
      
      const supervisorDoc = await serverDb.collection('users').doc(supervisorUid).get();
      if (!supervisorDoc.exists) {
        throw new Error(`Supervisor not found: ${supervisorUid}`);
      }
      const supervisorData = supervisorDoc.data();
      if (!supervisorData) {
        throw new Error(`Supervisor data not found: ${supervisorUid}`);
      }
      const supervisorEmail = supervisorData.email;
      
      console.log('Order approved email data:', { requesterUid, supervisorUid, orderId, orderNo: orderData.orderNo });

      try {
        await emailService.notifyOrderApproved({
          requesterName: requesterData.displayName || requesterData.firstName + ' ' + requesterData.lastName || 'ผู้ขอซื้อ',
          requesterEmail,
          supervisorName: supervisorData.displayName || supervisorData.firstName + ' ' + supervisorData.lastName || 'หัวหน้างาน',
          orderNo: orderData.orderNo,
          date: orderData.date,
          items: orderData.items,
          total: orderData.totalAmount
        });
        console.log('Requester email sent successfully');
      } catch (error) {
        console.error('Error sending email to requester:', error);
      }

      const querySnapshot = await serverDb.collection('users').where('role', '==', 'procurement').get();
      
      const procurementUsers: Array<{
        uid: string;
        email: string;
        name: string;
        role: string;
      }> = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        procurementUsers.push({
          uid: doc.id,
          email: data.email || '',
          name: data.displayName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : 'ผู้จัดซื้อ'),
          role: data.role
        });
      });
      
      console.log('Found procurement users:', procurementUsers);

      const procurementPromises = procurementUsers.map(async (user) => {
        try {
          const success = await emailService.notifyProcurement({
            procurementName: user.name || 'ผู้จัดซื้อ',
            procurementEmail: user.email,
            orderNo: orderData.orderNo,
            requesterName: requesterData.displayName || requesterData.firstName + ' ' + requesterData.lastName || 'ผู้ขอซื้อ',
            date: orderData.date,
            items: orderData.items,
            total: orderData.totalAmount
          });
          
          return {
            user: user.name,
            success,
            status: success ? 'success' : 'failed'
          };
        } catch (error) {
          console.error(`Error sending email to procurement user ${user.name}:`, error);
          return {
            user: user.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const procurementResults = await Promise.all(procurementPromises);
      console.log('Procurement email results:', procurementResults);
      
      result = true;

    } else if (type === 'order-rejected') {
      const { requesterUid, supervisorUid, orderId } = data;
      
      const { serverDb } = await import('../../firebase/server');
      
      const orderDoc = await serverDb.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        throw new Error(`Order not found: ${orderId}`);
      }
      const orderData = orderDoc.data();
      if (!orderData) {
        throw new Error(`Order data not found: ${orderId}`);
      }
      
      const requesterDoc = await serverDb.collection('users').doc(requesterUid).get();
      if (!requesterDoc.exists) {
        throw new Error(`Requester not found: ${requesterUid}`);
      }
      const requesterData = requesterDoc.data();
      if (!requesterData) {
        throw new Error(`Requester data not found: ${requesterUid}`);
      }
      const requesterEmail = requesterData.email;
      
      const supervisorDoc = await serverDb.collection('users').doc(supervisorUid).get();
      if (!supervisorDoc.exists) {
        throw new Error(`Supervisor not found: ${supervisorUid}`);
      }
      const supervisorData = supervisorDoc.data();
      if (!supervisorData) {
        throw new Error(`Supervisor data not found: ${supervisorUid}`);
      }

      result = await emailService.notifyOrderRejected({
        requesterName: requesterData.displayName || requesterData.firstName + ' ' + requesterData.lastName || 'ผู้ขอซื้อ',
        requesterEmail,
        supervisorName: supervisorData.displayName || supervisorData.firstName + ' ' + supervisorData.lastName || 'หัวหน้างาน',
        orderNo: orderData.orderNo
      });
      console.log('Order rejected email sent:', result);
    }

    return new Response(JSON.stringify({
      success: result,
      message: result ? 'Email sent successfully' : 'Failed to send email'
    }), {
      status: result ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send email error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};