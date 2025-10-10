import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
type Unsubscribe = () => void;
import { db } from '../firebase/client';
import { COLLECTIONS } from '../lib/constants';
import type { Order, OrderStatus, ProcurementStatus, UserRole } from '../types';

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  unsubscribe: Unsubscribe | null;
}

interface OrdersActions {
  setOrders: (orders: Order[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchOrders: (userUid: string, role: UserRole) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateProcurementStatus: (orderId: string, status: ProcurementStatus) => void;
  cleanup: () => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByUser: (userUid: string) => Order[];
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>()(
  subscribeWithSelector((set, get) => ({
    orders: [],
    loading: false,
    error: null,
    lastFetch: null,
    unsubscribe: null,
    setOrders: (orders) => set({ 
      orders, 
      lastFetch: Date.now(),
      error: null 
    }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    fetchOrders: (userUid: string, role: UserRole) => {
      const { unsubscribe } = get();
      
      if (unsubscribe) {
        unsubscribe();
      }

      set({ loading: true, error: null });

      let q;
      
      if (role === 'employee') {
        q = query(
          collection(db, COLLECTIONS.ORDERS),
          where('requesterUid', '==', userUid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      } else if (role === 'supervisor') {
        q = query(
          collection(db, COLLECTIONS.ORDERS),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else if (role === 'procurement') {
        q = query(
          collection(db, COLLECTIONS.ORDERS),
          where('status', 'in', ['approved', 'in_progress', 'delivered']),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else if (role === 'admin') {
        set({ 
          loading: false, 
          error: 'Admin ไม่มีสิทธิ์เข้าถึงใบขอซื้อ',
          orders: []
        });
        return;
      } else {
        set({ 
          loading: false, 
          error: 'ไม่พบ role ในระบบ',
          orders: []
        });
        return;
      }

      const newUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              orderNo: data.orderNo || 0,
              date: data.date || '',
              requesterName: data.requesterName || '',
              requesterUid: data.requesterUid || '',
              total: Number(data.total || 0),
              totalAmount: Number(data.totalAmount || data.total || 0),
              status: (data.status || 'pending') as OrderStatus,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              items: data.items || [],
              itemsCategories: data.itemsCategories || {},
              itemsStatuses: data.itemsStatuses || {},
              procurementStatus: data.procurementStatus,
              timestamps: data.timestamps || {},
              approvedBy: data.approvedBy,
              approvedByUid: data.approvedByUid,
              approvedAt: data.approvedAt,
              rejectedReason: data.rejectedReason,
              rejectedAt: data.rejectedAt,
              rejectedByUid: data.rejectedByUid,
              procurementNote: data.procurementNote,
              expectedDate: data.expectedDate,
              deliveredDate: data.deliveredDate,
              trackingNumber: data.trackingNumber,
              vendorId: data.vendorId,
              vendorName: data.vendorName,
              poNumber: data.poNumber,
            } as Order;
          });
          
          set({ 
            orders, 
            loading: false, 
            error: null,
            lastFetch: Date.now()
          });
        },
        (error) => {
          console.error('Orders fetch error:', error);
          set({ 
            error: String(error?.message || error), 
            loading: false,
            orders: []
          });
        }
      );

      set({ unsubscribe: newUnsubscribe });
    },

    updateOrder: (orderId: string, updates: Partial<Order>) => {
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, ...updates } : order
        )
      }));
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus) => {
      try {
        await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
          status,
          updatedAt: serverTimestamp(),
        });
        
        get().updateOrder(orderId, { status });
      } catch (error) {
        console.error('Error updating order status:', error);
        set({ error: String(error) });
      }
    },

    updateProcurementStatus: async (orderId: string, status: ProcurementStatus) => {
      try {
        await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
          procurementStatus: status,
          updatedAt: serverTimestamp(),
        });
        
        get().updateOrder(orderId, { procurementStatus: status });
      } catch (error) {
        console.error('Error updating procurement status:', error);
        set({ error: String(error) });
      }
    },

    cleanup: () => {
      const { unsubscribe } = get();
      if (unsubscribe) {
        unsubscribe();
        set({ unsubscribe: null });
      }
    },

    getOrderById: (orderId: string) => {
      const { orders } = get();
      return orders.find(order => order.id === orderId);
    },

    getOrdersByStatus: (status: OrderStatus) => {
      const { orders } = get();
      return orders.filter(order => order.status === status);
    },

    getOrdersByUser: (userUid: string) => {
      const { orders } = get();
      return orders.filter(order => order.requesterUid === userUid);
    }
  }))
);

export const useOrders = () => useOrdersStore((state) => state.orders);
export const useOrdersLoading = () => useOrdersStore((state) => state.loading);
export const useOrdersError = () => useOrdersStore((state) => state.error);

export const useOrdersByStatus = (status: OrderStatus) => 
  useOrdersStore((state) => state.getOrdersByStatus(status));

export const useOrdersByUser = (userUid: string) => 
  useOrdersStore((state) => state.getOrdersByUser(userUid));

export const useOrderById = (orderId: string) => 
  useOrdersStore((state) => state.getOrderById(orderId));

export const useOrdersStats = () => 
  useOrdersStore((state) => {
    const orders = state.orders;
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      approved: orders.filter(o => o.status === 'approved').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0)
    };
});