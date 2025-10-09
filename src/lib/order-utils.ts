import type { 
  OrderStatus, 
  ItemType, 
  ProcurementStatus, 
  StatusBadgeConfig,
  Order,
  OrderStats
} from '../types';

import {
  ORDER_STATUS_LABELS,
  RAW_MATERIAL_WORKFLOW,
  OTHER_ITEMS_WORKFLOW,
  COMPLETED_PROCUREMENT_STATUSES,
  type DateFilterValue
} from './constants';

import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO
} from 'date-fns';

export const toNum = (value: string | number): number => {
  const n = parseFloat(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export const calculateLineTotal = (quantity: string | number, amount: string | number): number => {
  return toNum(quantity) * toNum(amount);
};

export const calculateGrandTotal = (items: Array<{ quantity: string | number; amount: string | number }>): number => {
  return items.reduce((sum, item) => sum + calculateLineTotal(item.quantity, item.amount), 0);
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('th-TH')} บาท`;
};

export const formatCurrencyShort = (amount: number): string => {
  return amount.toLocaleString('th-TH');
};

export const generateOrderNumber = (orderNo: number, date: string): string => {
  if (!orderNo || !date) {
    return `PR${orderNo?.toString().padStart(3, '0') ?? '000'}`;
  }
  
  const orderDate = new Date(date);
  
  if (isNaN(orderDate.getTime())) {
    console.warn('Invalid date provided to generateOrderNumber:', date);
    return `PR${orderNo.toString().padStart(3, '0')}`;
  }
  
  const year = orderDate.getFullYear();
  const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
  const number = orderNo.toString().padStart(3, '0');
  
  return `PR${year}${month}-${number}`;
};

export const formatOrderNumber = (orderNo: number | string): string => {
  if (typeof orderNo === 'string') return orderNo;
  return `#${orderNo}`;
};

// Helper function for displaying order number with better performance
export const getDisplayOrderNumber = (order: { orderNo?: number; date?: string }): string => {
  if (!order.orderNo) return 'PR000';
  
  if (order.date) {
    return generateOrderNumber(order.orderNo, order.date);
  }
  
  return `PR${order.orderNo.toString().padStart(3, '0')}`;
};

export const getStatusLabel = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getStatusBadgeConfig = (status: string): StatusBadgeConfig => {
  const configs: Record<string, StatusBadgeConfig> = {
    pending: { 
      variant: "warning",
      appearance: "light",
      label: 'รออนุมัติ' 
    },
    approved: { 
      variant: "success",
      appearance: "light",
      label: 'อนุมัติแล้ว' 
    },
    rejected: { 
      variant: "destructive",
      appearance: "light",
      label: 'ไม่อนุมัติ' 
    },
    in_progress: { 
      variant: "info",
      appearance: "light",
      label: 'กำลังดำเนินการ' 
    },
    delivered: { 
      variant: "success",
      appearance: "light",
      label: 'ได้รับแล้ว' 
    }
  };

  return configs[status] || configs.pending;
};

export const isStatusEditable = (status: OrderStatus): boolean => {
  return status === 'pending';
};

export const isStatusDeletable = (status: OrderStatus): boolean => {
  return status === 'pending';
};

export const isStatusApprovable = (status: OrderStatus): boolean => {
  return status === 'pending';
};

export const getItemCategory = (itemType: ItemType): 'raw_material' | 'other' => {
  return itemType === 'วัตถุดิบ' ? 'raw_material' : 'other';
};

export const getItemTypeColor = (itemType: ItemType): string => {
  const colors: Record<ItemType, string> = {
    'วัตถุดิบ': 'bg-green-100 text-green-800 border-green-200',
    'เครื่องมือ': 'bg-blue-100 text-blue-800 border-blue-200',
    'วัสดุสิ้นเปลือง': 'bg-orange-100 text-orange-800 border-orange-200',
    'Software/Hardware': 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return colors[itemType] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getItemTypeIconColor = (itemType: ItemType): string => {
  const colors: Record<ItemType, string> = {
    'วัตถุดิบ': 'text-green-600',
    'เครื่องมือ': 'text-blue-600',
    'วัสดุสิ้นเปลือง': 'text-orange-600',
    'Software/Hardware': 'text-purple-600'
  };

  return colors[itemType] || 'text-gray-600';
};

export const getInitialProcurementStatus = (itemType: ItemType): ProcurementStatus => {
  const category = getItemCategory(itemType);
  return category === 'raw_material' ? 'จัดซื้อ' : 'จัดซื้อ_2';
};

export const getProcurementStatusDisplay = (status: ProcurementStatus): string => {
  const displayMap: Record<ProcurementStatus, string> = {
    'จัดซื้อ': 'จัดซื้อ',
    'จัดซื้อ_2': 'จัดซื้อ',
    'ของมาส่ง': 'ของมาส่ง',
    'ของมาส่ง_2': 'ของมาส่ง',
    'ส่งมอบของ': 'ส่งมอบของ',
    'ส่งมอบของ_2': 'ส่งมอบของ',
    'คลังสินค้า': 'คลังสินค้า'
  };

  return displayMap[status] || status;
};

export const isProcurementComplete = (status: ProcurementStatus): boolean => {
  return COMPLETED_PROCUREMENT_STATUSES.includes(status);
};

export const getProcurementWorkflow = (itemType: ItemType): ProcurementStatus[] => {
  const category = getItemCategory(itemType);
  return category === 'raw_material' ? RAW_MATERIAL_WORKFLOW : OTHER_ITEMS_WORKFLOW;
};

export const getNextProcurementStatus = (
  currentStatus: ProcurementStatus, 
  itemType: ItemType
): ProcurementStatus | null => {
  const workflow = getProcurementWorkflow(itemType);
  const currentIndex = workflow.indexOf(currentStatus);
  
  if (currentIndex === -1 || currentIndex === workflow.length - 1) {
    return null;
  }
  
  return workflow[currentIndex + 1];
};

export const formatDate = (timestamp: any): string => {
  if (!timestamp) return '-';
  
  try {
    let date: Date;
    
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '-';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543;
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

export const formatDateTime = (timestamp: any): string => {
  if (!timestamp) return '-';
  
  try {
    let date: Date;
    
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '-';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

export const toInputDateFormat = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const fromInputDateFormat = (dateString: string): Date => {
  return new Date(dateString);
};

export const getOrderStats = (orders: Order[]): OrderStats => {
  const stats: OrderStats = {
    total: orders.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0,
    delivered: 0,
    totalAmount: 0
  };

  orders.forEach(order => {
    switch (order.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'approved':
        stats.approved++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
      case 'in_progress':
        stats.inProgress++;
        break;
      case 'delivered':
        stats.delivered++;
        break;
    }
    
    stats.totalAmount += order.totalAmount || order.total || 0;
  });

  return stats;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidQuantity = (quantity: string | number): boolean => {
  const num = toNum(quantity);
  return num > 0;
};

export const isValidAmount = (amount: string | number): boolean => {
  const num = toNum(amount);
  return num > 0;
};

export const isValidOrderItem = (item: {
  description: string;
  receivedDate: string;
  quantity: string | number;
  amount: string | number;
}): boolean => {
  return (
    item.description.trim().length > 0 &&
    item.receivedDate.trim().length > 0 &&
    isValidQuantity(item.quantity) &&
    isValidAmount(item.amount)
  );
};

export const searchOrders = (orders: Order[], searchTerm: string): Order[] => {
  if (!searchTerm.trim()) return orders;
  
  const term = searchTerm.toLowerCase().trim();
  
  return orders.filter(order => {
    const orderNo = String(order.orderNo || '').toLowerCase();
    const requesterName = (order.requesterName || order.requester || '').toLowerCase();
    const date = (order.date || '').toLowerCase();
    
    return (
      orderNo.includes(term) ||
      requesterName.includes(term) ||
      date.includes(term)
    );
  });
};

export const filterOrdersByStatus = (orders: Order[], status: string): Order[] => {
  if (status === 'all' || !status) return orders;
  return orders.filter(order => order.status === status);
};

export const sortOrders = (
  orders: Order[], 
  sortBy: 'date' | 'orderNo' | 'amount', 
  direction: 'asc' | 'desc' = 'desc'
): Order[] => {
  const sorted = [...orders];
  
  sorted.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'orderNo':
        aValue = a.orderNo || 0;
        bValue = b.orderNo || 0;
        break;
      case 'amount':
        aValue = a.totalAmount || a.total || 0;
        bValue = b.totalAmount || b.total || 0;
        break;
      case 'date':
      default:
        aValue = a.createdAt?.seconds || 0;
        bValue = b.createdAt?.seconds || 0;
        break;
    }
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return sorted;
};

/**
 * Get date range based on filter value
 */
export const getDateRange = (filterValue: DateFilterValue): { from: Date; to: Date } | null => {
  if (filterValue === 'all') return null;
  
  const today = new Date();
  
  switch (filterValue) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay(today) };
    
    case 'thisMonth':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    
    case 'thisYear':
      return { from: startOfYear(today), to: endOfYear(today) };
    
    default:
      return null;
  }
};

/**
 * Filter orders by date range
 */
export const filterOrdersByDate = (orders: Order[], dateFilter: DateFilterValue): Order[] => {
  const dateRange = getDateRange(dateFilter);
  
  if (!dateRange) return orders;
  
  return orders.filter(order => {
    // Try to get date from multiple sources
    let orderDate: Date | null = null;
    
    // First try: order.date (string format)
    if (order.date) {
      try {
        // Assuming date is in format like "2024-01-15" or "15/01/2024"
        if (order.date.includes('/')) {
          const [day, month, year] = order.date.split('/');
          orderDate = new Date(`${year}-${month}-${day}`);
        } else {
          orderDate = parseISO(order.date);
        }
      } catch (e) {
        console.warn('Failed to parse order.date:', order.date, e);
      }
    }
    
    // Second try: order.createdAt (Firestore Timestamp)
    if (!orderDate && order.createdAt?.toDate) {
      try {
        orderDate = order.createdAt.toDate();
      } catch (e) {
        console.warn('Failed to convert createdAt to date:', e);
      }
    }
    
    // Third try: order.createdAt.seconds (Firestore Timestamp format)
    if (!orderDate && order.createdAt?.seconds) {
      try {
        orderDate = new Date(order.createdAt.seconds * 1000);
      } catch (e) {
        console.warn('Failed to convert timestamp seconds:', e);
      }
    }
    
    if (!orderDate || isNaN(orderDate.getTime())) {
      return false; // Skip invalid dates
    }
    
    return isWithinInterval(orderDate, { start: dateRange.from, end: dateRange.to });
  });
};

/**
 * Filter orders by date range (using DateRange from react-day-picker)
 */
export const filterOrdersByDateRange = (orders: Order[], dateRange: { from?: Date; to?: Date }): Order[] => {
  if (!dateRange?.from) return orders;
  
  const from = startOfDay(dateRange.from);
  const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
  
  return orders.filter(order => {
    // Try to get date from multiple sources
    let orderDate: Date | null = null;
    
    // First try: order.date (string format)
    if (order.date) {
      try {
        // Assuming date is in format like "2024-01-15" or "15/01/2024"
        if (order.date.includes('/')) {
          const [day, month, year] = order.date.split('/');
          orderDate = new Date(`${year}-${month}-${day}`);
        } else {
          orderDate = parseISO(order.date);
        }
      } catch (e) {
        console.warn('Failed to parse order.date:', order.date, e);
      }
    }
    
    // Second try: order.createdAt (Firestore Timestamp)
    if (!orderDate && order.createdAt?.toDate) {
      try {
        orderDate = order.createdAt.toDate();
      } catch (e) {
        console.warn('Failed to convert createdAt to date:', e);
      }
    }
    
    // Third try: order.createdAt.seconds (Firestore Timestamp format)
    if (!orderDate && order.createdAt?.seconds) {
      try {
        orderDate = new Date(order.createdAt.seconds * 1000);
      } catch (e) {
        console.warn('Failed to convert timestamp seconds:', e);
      }
    }
    
    if (!orderDate || isNaN(orderDate.getTime())) {
      return false; // Skip invalid dates
    }
    
    return isWithinInterval(orderDate, { start: from, end: to });
  });
};

/**
 * Get date filter label for display
 */
export const getDateFilterLabel = (filterValue: DateFilterValue): string => {
  const options = [
    { label: 'วันนี้', value: 'today' },
    { label: 'เดือนนี้', value: 'thisMonth' },
    { label: 'ปีนี้', value: 'thisYear' },
    { label: 'ทั้งหมด', value: 'all' },
  ];
  
  return options.find(opt => opt.value === filterValue)?.label || 'ทั้งหมด';
};