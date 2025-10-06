export type UserRole = 'buyer' | 'supervisor' | 'procurement' | 'superadmin';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
}

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

export type ItemType = 'วัตถุดิบ' | 'เครื่องมือ' | 'วัสดุสิ้นเปลือง' | 'Software/Hardware';

export type ProcurementStatus = 
  | 'จัดซื้อ' 
  | 'ของมาส่ง' 
  | 'ส่งมอบของ' 
  | 'คลังสินค้า' 
  | 'จัดซื้อ_2' 
  | 'ของมาส่ง_2' 
  | 'ส่งมอบของ_2';

export interface OrderItemInput {
  no: number;
  description: string;
  receivedDate: string;
  quantity: string;
  amount: string;
  itemType: ItemType;
}

export interface OrderItem {
  description: string;
  receivedDate: string | null;
  quantity: number;
  amount: number;
  lineTotal: number;
  itemType: ItemType;
  category?: string;
  itemStatus?: string;
}

export interface OrderTimestamps {
  submitted?: any;
  approved?: any;
  rejected?: any;
  procurementStarted?: any;
  procurementUpdated?: any;
  delivered?: any;
}

export interface Order {
  id: string;
  orderNo: number;
  date: string;
  requester?: string;
  requesterName?: string;
  requesterUid: string;
  items: OrderItem[];
  total?: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: any;
  updatedAt?: any;
  procurementStatus?: ProcurementStatus;
  timestamps?: OrderTimestamps;
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
  approvedBy?: string;
  approvedByUid?: string;
  approvedAt?: any;
  rejectedReason?: string;
  rejectedAt?: any;
  rejectedByUid?: string;
  procurementNote?: string;
  expectedDate?: string;
  deliveredDate?: string;
  trackingNumber?: string;
  vendorId?: string;
  vendorName?: string;
  poNumber?: string;
}

export type NotificationKind = 
  | 'approval_request'
  | 'approved'
  | 'rejected'
  | 'status_update';

export interface Notification {
  id: string;
  title: string;
  message: string;
  orderId: string;
  orderNo: number;
  kind: NotificationKind;
  toUserUid?: string | null;
  forRole?: UserRole | null;
  fromUserUid: string;
  fromUserName: string;
  read: boolean;
  readAt?: any;
  createdAt: any;
  updatedAt?: any;
}

export interface StatusBadgeConfig {
  variant: "primary" | "secondary" | "destructive" | "success" | "warning" | "info";
  appearance: "default" | "light" | "outline" | "ghost";
  label: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inProgress: number;
  delivered: number;
  totalAmount: number;
}

export interface CreateOrderPayload {
  date: string;
  requesterName: string;
  items: OrderItemInput[];
}

export interface EmailNotificationData {
  type: 'order-created' | 'order-approved' | 'order-rejected';
  data: {
    requesterUid?: string;
    supervisorUid?: string;
    orderId: string;
    orderNo?: number;
    requesterName?: string;
    date?: string;
    items?: OrderItem[];
    total?: number;
  };
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface UserFormData {
  email: string;
  displayName: string;
  role: UserRole;
  password?: string;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface FilterState {
  searchTerm: string;
  statusFilter: string;
}