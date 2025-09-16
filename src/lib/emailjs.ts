// src/lib/emailjs.ts
import emailjs from '@emailjs/browser';

// Configuration
const EMAILJS_CONFIG = {
  serviceId: 'your_service_id',     // จะได้จาก EmailJS
  templateId: 'your_template_id',   // จะได้จาก EmailJS
  publicKey: 'your_public_key'      // จะได้จาก EmailJS
};

/**
 * ส่งอีเมลแจ้งเตือนใบสั่งซื้อใหม่
 */
export async function sendNewOrderEmail(params: {
  supervisorEmail: string;
  supervisorName: string;
  requesterName: string;
  orderNo: number;
  orderDate: string;
  totalAmount: number;
}) {
  try {
    const templateParams = {
      to_email: params.supervisorEmail,
      to_name: params.supervisorName,
      from_name: 'ระบบใบสั่งซื้อ',
      subject: `🛒 ใบสั่งซื้อใหม่รออนุมัติ #${params.orderNo}`,
      order_no: params.orderNo,
      requester_name: params.requesterName,
      order_date: params.orderDate,
      total_amount: params.totalAmount.toLocaleString('th-TH'),
      message: `มีใบสั่งซื้อใหม่จาก ${params.requesterName} จำนวน ${params.totalAmount.toLocaleString('th-TH')} บาท รอการอนุมัติ`,
      approval_url: `${window.location.origin}/orders/tracking`
    };

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('✅ Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

/**
 * ส่งอีเมลแจ้งเตือนเมื่อใบสั่งซื้อได้รับการอนุมัติ
 */
export async function sendApprovedEmail(params: {
  procurementEmail: string;
  procurementName: string;
  requesterName: string;
  orderNo: number;
  orderDate: string;
  totalAmount: number;
  approverName: string;
}) {
  try {
    const templateParams = {
      to_email: params.procurementEmail,
      to_name: params.procurementName,
      from_name: 'ระบบใบสั่งซื้อ',
      subject: `✅ ใบสั่งซื้อได้รับการอนุมัติ #${params.orderNo}`,
      order_no: params.orderNo,
      requester_name: params.requesterName,
      order_date: params.orderDate,
      total_amount: params.totalAmount.toLocaleString('th-TH'),
      approver_name: params.approverName,
      message: `ใบสั่งซื้อ #${params.orderNo} ได้รับการอนุมัติจาก ${params.approverName} แล้ว กรุณาดำเนินการจัดซื้อ`,
      procurement_url: `${window.location.origin}/orders/list`
    };

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      'template_procurement', // อีก template หนึ่ง
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('✅ Procurement email sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Procurement email failed:', error);
    throw error;
  }
}

/**
 * ส่งอีเมลแจ้งเตือนอัปเดตสถานะ
 */
export async function sendStatusUpdateEmail(params: {
  buyerEmail: string;
  buyerName: string;
  orderNo: number;
  status: string;
  message?: string;
}) {
  try {
    const templateParams = {
      to_email: params.buyerEmail,
      to_name: params.buyerName,
      from_name: 'ระบบใบสั่งซื้อ',
      subject: `📦 อัปเดตสถานะใบสั่งซื้อ #${params.orderNo}`,
      order_no: params.orderNo,
      status: params.status,
      message: params.message || `ใบสั่งซื้อ #${params.orderNo} มีการอัปเดตสถานะเป็น ${params.status}`,
      tracking_url: `${window.location.origin}/orders/tracking`
    };

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      'template_status_update', // template สำหรับอัปเดตสถานะ
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('✅ Status update email sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Status update email failed:', error);
    throw error;
  }
}

/**
 * Initialize EmailJS (เรียกใน main app)
 */
export function initEmailJS() {
  emailjs.init(EMAILJS_CONFIG.publicKey);
  console.log('📧 EmailJS initialized');
}