export const MAILJET_TEMPLATES = {
  ORDER_CREATED: 7351277,
  ORDER_APPROVED: 7351285,
  ORDER_REJECTED: 7351287,
  PROCUREMENT_NOTIFICATION: 7351286,
} as const;

export type TemplateType = keyof typeof MAILJET_TEMPLATES;

export interface TemplateVariables {
  supervisorName?: string;
  requesterName?: string;
  procurementName?: string;
  orderNo?: number;
  date?: string;
  totalAmount?: number;
  itemCount?: number;
  
  items?: Array<{
    description: string;
    quantity: number;
    amount: number;
    lineTotal: number;
  }>;
}

export function createTemplateVariables(data: any): TemplateVariables {
  return {
    supervisorName: data.supervisorName,
    requesterName: data.requesterName,
    procurementName: data.procurementName,
    orderNo: data.orderNo,
    date: data.date,
    totalAmount: data.total || data.totalAmount,
    itemCount: data.items?.length || 0,
    items: data.items?.map((item: any) => ({
      description: item.description || '',
      quantity: item.quantity || 0,
      amount: item.amount || 0,
      lineTotal: item.lineTotal || 0
    })) || []
  };
}