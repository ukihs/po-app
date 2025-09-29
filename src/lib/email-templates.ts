export interface OrderCreatedData {
  requesterName: string;
  requesterEmail: string;
  supervisorName: string;
  supervisorEmail: string;
  orderNo: number;
  date: string;
  items: Array<any>;
  total: number;
}

export interface OrderApprovedData {
  requesterName: string;
  requesterEmail: string;
  supervisorName: string;
  orderNo: number;
  date?: string;
  items?: Array<any>;
  total?: number;
}

export interface OrderRejectedData {
  requesterName: string;
  requesterEmail: string;
  supervisorName: string;
  orderNo: number;
}

export interface ProcurementData {
  procurementName: string;
  orderNo: number;
  requesterName?: string;
  date?: string;
  items?: Array<any>;
  total?: number;
}


export function getOrderCreatedTemplate(data: OrderCreatedData) {
  const requesterName = data.requesterName
  const supervisorName = data.supervisorName
  const orderNo = data.orderNo
  const date = data.date || new Date().toLocaleDateString('th-TH');
  const items = data.items
  const total = data.total
  
  return {
    subject: `แจ้งเตือน: ใบขอซื้อใหม่จาก ${requesterName}`,
    textContent: `
แจ้งเตือนใบขอซื้อใหม่

เรียน ${supervisorName},

มีใบขอซื้อใหม่ที่รอการอนุมัติจากคุณ

รายละเอียดใบขอซื้อ:
- หมายเลขใบขอซื้อ: #${orderNo}
- ผู้ขอซื้อ: ${requesterName}
- วันที่สร้าง: ${date}
- จำนวนรายการ: ${items.length} รายการ
- ยอดรวม: ฿${total.toLocaleString('th-TH')}
- สถานะ: รอการอนุมัติ

กรุณาตรวจสอบและดำเนินการอนุมัติหรือไม่อนุมัติใบขอซื้อนี้

---
อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ
    `,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background-color: #1f2937; color: white; padding: 12px 24px; border-radius: 24px; font-weight: bold; font-size: 18px;">
              ใบขอซื้อใหม่รอการอนุมัติ
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="margin-bottom: 24px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">เรียนคุณ <strong>${supervisorName}</strong>,</p>
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">มีใบขอซื้อใหม่ที่รอการอนุมัติจากคุณ</p>
          </div>
          
          <!-- Order Details Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">รายละเอียดใบขอซื้อ</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">หมายเลขใบขอซื้อ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">#${orderNo}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">ผู้ขอซื้อ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${requesterName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">วันที่สร้าง :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${date}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">จำนวนรายการ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${items.length} รายการ</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">สถานะ :</span>
                <span style="color: #f59e0b; font-weight: 600; font-size: 14px;">รอการอนุมัติ</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                <span style="color: #1f2937; font-weight: 600; font-size: 16px;">ยอดรวม :</span>
                <span style="color: #1f2937; font-weight: 700; font-size: 16px;">฿${total.toLocaleString('th-TH')}</span>
              </div>
            </div>
          </div>
          
          <!-- Action Message -->
          <div style="background-color: #f8fafc; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #374151; margin: 0; font-size: 14px; font-weight: 500;">
              โปรดตรวจสอบและดำเนินการอนุมัติใบขอซื้อที่ระบบใบขอซื้อ
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
              อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ โปรดอย่าตอบกลับอีเมลนี้
            </p>
          </div>
        </div>
      </div>
    `
  };
}

export function getOrderApprovedTemplate(data: OrderApprovedData) {
  const requesterName = data.requesterName
  const supervisorName = data.supervisorName
  const orderNo = data.orderNo
  const date = data.date || new Date().toLocaleDateString('th-TH');
  const items = data.items || [];
  const total = data.total || 0;
  
  return {
    subject: `ใบขอซื้อ #${orderNo} ได้รับการอนุมัติแล้ว`,
    textContent: `
ใบขอซื้อได้รับการอนุมัติ

เรียน ${requesterName},

ใบขอซื้อ #${orderNo} ของคุณได้รับการอนุมัติจาก ${supervisorName} แล้ว

รายละเอียดใบขอซื้อ:
- หมายเลขใบขอซื้อ: #${orderNo}
- วันที่สร้าง: ${date}
- จำนวนรายการ: ${items.length} รายการ
- ยอดรวม: ฿${total.toLocaleString('th-TH')}

ฝ่ายจัดซื้อจะดำเนินการจัดซื้อต่อไป

---
อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ
    `,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background-color: #1f2937; color: white; padding: 12px 24px; border-radius: 24px; font-weight: bold; font-size: 18px;">
              ใบขอซื้อได้รับการอนุมัติแล้ว
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="margin-bottom: 24px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">เรียนคุณ <strong>${requesterName}</strong>,</p>
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">ใบขอซื้อ #${orderNo} ของคุณได้รับการอนุมัติจากคุณ <strong>${supervisorName}</strong> เรียบร้อยแล้ว</p>
          </div>
          
          <!-- Order Details Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">รายละเอียดใบขอซื้อ</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">หมายเลขใบขอซื้อ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">#${orderNo}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">วันที่สร้าง :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${date}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">จำนวนรายการ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${items.length} รายการ</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                <span style="color: #1f2937; font-weight: 600; font-size: 16px;">ยอดรวม :</span>
                <span style="color: #1f2937; font-weight: 700; font-size: 16px;">฿${total.toLocaleString('th-TH')}</span>
              </div>
            </div>
          </div>
          
          <!-- Status Message -->
          <div style="background-color: #f8fafc; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #374151; margin: 0; font-size: 14px; font-weight: 500;">
              ฝ่ายจัดซื้อจะดำเนินการจัดซื้อในลำดับต่อไป คุณสามารถติดตามสถานะใบขอซื้อได้ที่ระบบใบขอซื้อ.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
              อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ โปรดอย่าตอบกลับอีเมลนี้
            </p>
          </div>
        </div>
      </div>
    `
  };
}

export function getOrderRejectedTemplate(data: OrderRejectedData) {
  const requesterName = data.requesterName
  const supervisorName = data.supervisorName
  const orderNo = data.orderNo
  
  return {
    subject: `ใบขอซื้อ #${orderNo} ไม่ได้รับการอนุมัติ`,
    textContent: `
ใบขอซื้อไม่ได้รับการอนุมัติ

เรียน ${requesterName},

ใบขอซื้อ #${orderNo} ของคุณไม่ได้รับการอนุมัติจาก ${supervisorName}

กรุณาติดต่อหัวหน้างานเพื่อสอบถามรายละเอียดเพิ่มเติม

---
อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ
    `,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background-color: #1f2937; color: white; padding: 12px 24px; border-radius: 24px; font-weight: bold; font-size: 18px;">
              ใบขอซื้อไม่ได้รับการอนุมัติ
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="margin-bottom: 24px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">เรียนคุณ <strong>${requesterName}</strong>,</p>
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">ใบขอซื้อ #${orderNo} ของคุณไม่ได้รับการอนุมัติจาก <strong>${supervisorName}</strong></p>
          </div>
          
          <!-- Status Message -->
          <div style="background-color: #f8fafc; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #374151; margin: 0; font-size: 14px; font-weight: 500;">
              โปรดติดต่อหัวหน้างานเพื่อสอบถามรายละเอียดเพิ่มเติม
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
              อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้
            </p>
          </div>
        </div>
      </div>
    `
  };
}

export function getProcurementTemplate(data: ProcurementData) {
  const procurementName = data.procurementName
  const orderNo = data.orderNo
  const requesterName = data.requesterName
  const date = data.date || new Date().toLocaleDateString('th-TH');
  const items = data.items || [];
  const total = data.total || 0;
  
  return {
    subject: `ใบขอซื้อ #${orderNo} รอดำเนินการจัดซื้อ`,
    textContent: `
ใบขอซื้อรอดำเนินการจัดซื้อ

เรียน ${procurementName},

มีใบขอซื้อ #${orderNo} ที่ได้รับการอนุมัติแล้ว รอการจัดซื้อจากฝ่ายจัดซื้อ

รายละเอียดใบขอซื้อ:
- หมายเลขใบขอซื้อ: #${orderNo}
- ผู้ขอซื้อ: ${requesterName}
- วันที่สร้าง: ${date}
- จำนวนรายการ: ${items.length} รายการ
- ยอดรวม: ฿${total.toLocaleString('th-TH')}

กรุณาดำเนินการจัดซื้อตามใบขอซื้อนี้

---
อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ
    `,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background-color: #1f2937; color: white; padding: 12px 24px; border-radius: 24px; font-weight: bold; font-size: 18px;">
              ใบขอซื้อรอดำเนินการจัดซื้อ
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="margin-bottom: 24px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">เรียนคุณ <strong>${procurementName}</strong>,</p>
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">มีใบขอซื้อ #${orderNo} ที่ได้รับการอนุมัติแล้ว และรอดำเนินการจัดซื้อจากคุณ</p>
          </div>
          
          <!-- Order Details Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">รายละเอียดใบขอซื้อ</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">หมายเลขใบขอซื้อ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">#${orderNo}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">ผู้ขอซื้อ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${requesterName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">วันที่สร้าง :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${date}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">จำนวนรายการ :</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${items.length} รายการ</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                <span style="color: #1f2937; font-weight: 600; font-size: 16px;">ยอดรวม :</span>
                <span style="color: #1f2937; font-weight: 700; font-size: 16px;">฿${total.toLocaleString('th-TH')}</span>
              </div>
            </div>
          </div>
          
          <!-- Action Message -->
          <div style="background-color: #f8fafc; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #374151; margin: 0; font-size: 14px; font-weight: 500;">
              โปรดดำเนินการจัดซื้อตามใบขอซื้อนี้
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
              อีเมลนี้ถูกส่งจากระบบใบขอซื้ออัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้
            </p>
          </div>
        </div>
      </div>
    `
  };
}