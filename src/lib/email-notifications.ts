export async function sendOrderCreatedNotification(
  requesterUid: string,
  orderId: string,
  orderData: {
    orderNo: number;
    requesterName: string;
    date: string;
    items: Array<any>;
    total: number;
  }
) {
  try {
    console.log('sendOrderCreatedNotification: Starting...', { requesterUid, orderId, orderData });
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'order-created',
        data: {
          requesterUid,
          orderId,
          orderNo: orderData.orderNo,
          requesterName: orderData.requesterName,
          date: orderData.date,
          items: orderData.items,
          total: orderData.total
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Email API error: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('sendOrderCreatedNotification: Result:', result);
    return result.success;
  } catch (error) {
    console.error('sendOrderCreatedNotification: Error:', error);
    throw error;
  }
}

export async function sendOrderApprovedNotification(
  requesterUid: string,
  supervisorUid: string,
  orderId: string
) {
  try {
    console.log('sendOrderApprovedNotification: Starting...', { requesterUid, supervisorUid, orderId });
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'order-approved',
        data: {
          requesterUid,
          supervisorUid,
          orderId
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Email API error: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('sendOrderApprovedNotification: Result:', result);
    return result.success;
  } catch (error) {
    console.error('sendOrderApprovedNotification: Error:', error);
    throw error;
  }
}

export async function sendOrderRejectedNotification(
  requesterUid: string,
  supervisorUid: string,
  orderId: string
) {
  try {
    console.log('sendOrderRejectedNotification: Starting...', { requesterUid, supervisorUid, orderId });
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'order-rejected',
        data: {
          requesterUid,
          supervisorUid,
          orderId
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Email API error: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('sendOrderRejectedNotification: Result:', result);
    return result.success;
  } catch (error) {
    console.error('sendOrderRejectedNotification: Error:', error);
    throw error;
  }
}