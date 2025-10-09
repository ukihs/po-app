import type { UserRole, OrderStatus, ItemType, ProcurementStatus } from '../types';

export const PROTECTED_ROUTES = [
  '/orders/create',
  '/orders/tracking',
  '/orders/notifications',
  '/orders/list',
  '/admin/users',
  '/admin/orders'
] as const;

// Hierarchical permission system
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  employee: 1,
  supervisor: 2,
  procurement: 3,
  admin: 99  // Separated - service account only
} as const;

// Check if user has minimum required role (hierarchical)
export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  if (userRole === 'admin') return false; // Admin can't access order workflow
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Check if user has specific role (exact match)
export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

export const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  '/orders/create': ['employee', 'supervisor', 'procurement'],
  '/orders/tracking': ['employee', 'supervisor', 'procurement'],
  '/orders/notifications': ['employee', 'supervisor', 'procurement'],
  '/orders/list': ['procurement'],
  '/admin/users': ['admin'],
  '/admin/orders': ['admin']
} as const;

export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  employee: '/orders/create',
  supervisor: '/orders/tracking',
  procurement: '/orders/list',
  admin: '/admin/users'
} as const;

export const ITEM_TYPES: ItemType[] = [
  'วัตถุดิบ',
  'เครื่องมือ',
  'วัสดุสิ้นเปลือง',
  'Software/Hardware'
] as const;

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'approved',
  'rejected',
  'in_progress',
  'delivered'
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  in_progress: 'กำลังดำเนินการ',
  delivered: 'ได้รับแล้ว'
} as const;

export const PROCUREMENT_STATUSES: ProcurementStatus[] = [
  'จัดซื้อ',
  'ของมาส่ง',
  'ส่งมอบของ',
  'คลังสินค้า',
  'จัดซื้อ_2',
  'ของมาส่ง_2',
  'ส่งมอบของ_2'
] as const;

export const RAW_MATERIAL_WORKFLOW: ProcurementStatus[] = [
  'จัดซื้อ',
  'ของมาส่ง',
  'ส่งมอบของ',
  'คลังสินค้า'
] as const;

export const OTHER_ITEMS_WORKFLOW: ProcurementStatus[] = [
  'จัดซื้อ_2',
  'ของมาส่ง_2',
  'ส่งมอบของ_2'
] as const;

export const COMPLETED_PROCUREMENT_STATUSES: ProcurementStatus[] = [
  'คลังสินค้า',
  'ส่งมอบของ_2'
] as const;

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  employee: 'พนักงาน',
  supervisor: 'หัวหน้างาน',
  procurement: 'ฝ่ายจัดซื้อ',
  admin: 'ผู้จัดการระบบ'
} as const;

export const USER_ROLES: UserRole[] = [
  'employee',
  'supervisor',
  'procurement',
  'admin'
] as const;

export const STAFF_ROLES: UserRole[] = [
  'supervisor',
  'procurement',
  'admin'
] as const;

export const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;

export const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

export const COLLECTIONS = {
  USERS: 'users',
  ORDERS: 'orders',
  NOTIFICATIONS: 'notifications',
  COUNTERS: 'counters',
  CATEGORIES: 'categories',
  SUPPLIERS: 'suppliers',
  DEPARTMENTS: 'departments',
  ITEM_CATEGORIES: 'itemCategories',
  ITEM_STATUSES: 'itemStatuses',
  LOGS: 'logs',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  TEMPLATES: 'templates',
  ATTACHMENTS: 'attachments',
  DEBUG: 'debug',
  SYSTEM: 'system',
  BACKUP: 'backup',
  AUDIT: 'audit'
} as const;

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50] as const;

export const MAX_DROPDOWN_ITEMS = 100;

export const DATE_FILTER_OPTIONS = [
  { label: 'วันนี้', value: 'today' },
  { label: 'เดือนนี้', value: 'thisMonth' },
  { label: 'ปีนี้', value: 'thisYear' },
  { label: 'ทั้งหมด', value: 'all' },
] as const;

export type DateFilterValue = typeof DATE_FILTER_OPTIONS[number]['value'];

export const DATE_FORMAT = 'DD/MM/YYYY';

export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

export const INPUT_DATE_FORMAT = 'YYYY-MM-DD';

export const MIN_PASSWORD_LENGTH = 6;

export const MAX_NAME_LENGTH = 100;

export const MAX_DESCRIPTION_LENGTH = 500;

export const MAX_ITEMS_PER_ORDER = 50;

export const STORAGE_KEYS = {
  USER_ROLE: 'po_user_role',
  USER_EMAIL: 'po_user_email',
  USER_DATA: 'po_user_data',
  THEME: 'theme'
} as const;

export const SESSION_STORAGE_KEYS = {
  LAST_VISITED_PAGE: 'po_last_visited_page',
  TEMP_FORM_DATA: 'po_temp_form_data'
} as const;

export const COOKIE_NAMES = {
  FIREBASE_ID_TOKEN: 'firebase-id-token'
} as const;

export const API_ENDPOINTS = {
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users/create',
    GET_BY_ID: (uid: string) => `/api/users/${uid}`,
    UPDATE: (uid: string) => `/api/users/${uid}`,
    DELETE: (uid: string) => `/api/users/${uid}`
  },
  ORDERS: {
    LIST: '/api/orders',
    CREATE: '/api/orders/create',
    GET_BY_ID: (id: string) => `/api/orders/${id}`,
    UPDATE: (id: string) => `/api/orders/${id}`,
    DELETE: (id: string) => `/api/orders/${id}`
  },
  EMAIL: {
    SEND: '/api/send-email'
  }
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    UNAUTHORIZED: 'กรุณาเข้าสู่ระบบ',
    FORBIDDEN: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
    SESSION_EXPIRED: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
    INVALID_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    INVALID_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',
    PASSWORD_TOO_SHORT: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`,
    INVALID_QUANTITY: 'กรุณาระบุจำนวนที่ถูกต้อง',
    INVALID_AMOUNT: 'กรุณาระบุราคาที่ถูกต้อง'
  },
  NETWORK: {
    CONNECTION_ERROR: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์',
    TIMEOUT: 'การเชื่อมต่อหมดเวลา',
    UNKNOWN_ERROR: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
  },
  ORDER: {
    NOT_FOUND: 'ไม่พบใบขอซื้อ',
    CANNOT_EDIT: 'ไม่สามารถแก้ไขใบขอซื้อนี้ได้',
    CANNOT_DELETE: 'ไม่สามารถลบใบขอซื้อนี้ได้',
    NO_ITEMS: 'กรุณาเพิ่มรายการสินค้า'
  }
} as const;

export const SUCCESS_MESSAGES = {
  ORDER: {
    CREATED: 'สร้างใบขอซื้อสำเร็จ',
    UPDATED: 'อัพเดทใบขอซื้อสำเร็จ',
    DELETED: 'ลบใบขอซื้อสำเร็จ',
    APPROVED: 'อนุมัติใบขอซื้อสำเร็จ',
    REJECTED: 'ไม่อนุมัติใบขอซื้อสำเร็จ'
  },
  USER: {
    CREATED: 'สร้างผู้ใช้สำเร็จ',
    UPDATED: 'อัพเดทข้อมูลผู้ใช้สำเร็จ',
    DELETED: 'ลบผู้ใช้สำเร็จ'
  },
  AUTH: {
    LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
    LOGOUT_SUCCESS: 'ออกจากระบบสำเร็จ'
  }
} as const;