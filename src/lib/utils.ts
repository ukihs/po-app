// src/lib/utils.ts
// Utility functions for Purchase Order System

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';
export type UserRole = 'buyer' | 'supervisor' | 'procurement';

/**
 * Format currency in Thai Baht
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

/**
 * Format currency without currency symbol
 */
export const formatNumber = (amount: number): string => {
  return amount.toLocaleString('th-TH');
};

/**
 * Format date in Thai format
 */
export const formatDate = (date: Date | string | any): string => {
  if (!date) return '-';
  
  let dateObj: Date;
  if (date.toDate) {
    // Firestore Timestamp
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '-';
  }

  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  });
};

/**
 * Format datetime in Thai format
 */
export const formatDateTime = (date: Date | string | any): string => {
  if (!date) return '-';
  
  let dateObj: Date;
  if (date.toDate) {
    // Firestore Timestamp
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '-';
  }

  return dateObj.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Translate order status to Thai
 */
export const getStatusLabel = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว', 
    rejected: 'ไม่อนุมัติ',
    in_progress: 'กำลังดำเนินการ',
    delivered: 'ได้รับแล้ว'
  };
  
  return statusMap[status] || status;
};

/**
 * Get status color for badges
 */
export const getStatusColor = (status: OrderStatus): string => {
  const colorMap: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800', 
    in_progress: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Translate user role to Thai
 */
export const getRoleLabel = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    buyer: 'ผู้ขอซื้อ',
    supervisor: 'หัวหน้างาน',
    procurement: 'ฝ่ายจัดซื้อ'
  };
  
  return roleMap[role] || role;
};

/**
 * Generate order number string (PO-YYYYMMDD-XXXX)
 */
export const formatOrderNumber = (orderNo: number, date?: Date): string => {
  const orderDate = date || new Date();
  const year = orderDate.getFullYear();
  const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
  const day = orderDate.getDate().toString().padStart(2, '0');
  const number = orderNo.toString().padStart(4, '0');
  
  return `PO-${year}${month}${day}-${number}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Thai format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+66|66|0)(\d{8,9})$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

/**
 * Clean and validate numeric input
 */
export const cleanNumber = (input: string): number => {
  const cleaned = input.replace(/[^\d.]/g, '');
  const number = parseFloat(cleaned);
  return Number.isFinite(number) ? number : 0;
};

/**
 * Calculate relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date | string | any): string => {
  if (!date) return '';
  
  let dateObj: Date;
  if (date.toDate) {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  
  return formatDate(dateObj);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Deep clone object (simple version)
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if user can perform action based on role and status
 */
export const canPerformAction = (
  userRole: UserRole, 
  action: 'create' | 'approve' | 'update_status' | 'view_all',
  orderStatus?: OrderStatus
): boolean => {
  switch (action) {
    case 'create':
      return userRole === 'buyer';
      
    case 'approve':
      return userRole === 'supervisor' && orderStatus === 'pending';
      
    case 'update_status':
      return userRole === 'procurement' && 
             (orderStatus === 'approved' || orderStatus === 'in_progress');
             
    case 'view_all':
      return userRole === 'supervisor' || userRole === 'procurement';
      
    default:
      return false;
  }
};

/**
 * Get next allowed statuses based on current status and role
 */
export const getNextStatuses = (
  currentStatus: OrderStatus, 
  userRole: UserRole
): OrderStatus[] => {
  if (userRole === 'supervisor' && currentStatus === 'pending') {
    return ['approved', 'rejected'];
  }
  
  if (userRole === 'procurement') {
    switch (currentStatus) {
      case 'approved':
        return ['in_progress'];
      case 'in_progress':
        return ['delivered'];
      default:
        return [];
    }
  }
  
  return [];
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: (key: string): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }
};

/**
 * Session storage helpers
 */
export const sessionStorage = {
  get: (key: string): any => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any): void => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from sessionStorage:', error);
    }
  }
};