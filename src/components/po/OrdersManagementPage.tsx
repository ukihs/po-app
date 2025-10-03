import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/client';
import {
  collection,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';
import { subscribeAuthAndRole } from '../../lib/auth';
import { Loader2, FileText, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import OrdersDataTable from './OrdersDataTable';

type Role = 'buyer' | 'supervisor' | 'procurement' | 'superadmin' | null;
type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

type OrderItem = {
  description?: string;
  quantity?: number;
  amount?: number;
  lineTotal?: number;
  category?: string;
  itemStatus?: string;
};

type Order = {
  id: string;
  orderNo?: number;
  date?: string;
  requester?: string;
  requesterName?: string;
  requesterUid?: string;
  total?: number;
  totalAmount?: number;
  status: OrderStatus;
  createdAt?: any;
  items?: OrderItem[];
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
};

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const off = subscribeAuthAndRole(async (authUser, r) => {
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      let effective: Role = (r as Role) || (localStorage.getItem('role') as Role) || null;
      if (!effective) {
        try {
          const u = await doc(db, 'users', authUser.uid);
          // Note: This needs to be fixed - should use getDoc
        } catch { }
      }
      setRole(effective);
      setUser(authUser);

      // ตรวจสอบสิทธิ์ superadmin
      if (effective !== 'superadmin') {
        setErr('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        setLoading(false);
        return;
      }

      unsub?.();
      const qRef = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(
        qRef,
        (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Order[];
          setOrders(list);
          setErr('');
          setLoading(false);
        },
        (e) => {
          setErr(String(e?.message || e));
          setLoading(false);
        }
      );
    });

    return () => {
      unsub?.();
      off?.();
    };
  }, []);

  const handleViewOrder = (order: Order) => {
    window.open(`/orders/${order.id}`, '_blank');
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      await deleteDoc(doc(db, 'orders', selectedOrder.id));
      
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('orderId', '==', selectedOrder.id)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      const deletePromises = notificationsSnapshot.docs.map(notificationDoc => 
        deleteDoc(notificationDoc.ref)
      );
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} notifications for order ${selectedOrder.id}`);
      }
      
      toast.success('ลบใบขอซื้อและการแจ้งเตือนที่เกี่ยวข้องสำเร็จ');
      setShowDeleteModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error('ลบใบขอซื้อไม่สำเร็จ: ' + (error?.message || error));
    }
  };


  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-8 sm:py-12">
          <div className="flex justify-center">
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">กำลังโหลดข้อมูลใบขอซื้อ...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full">
        <Alert className="mb-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Toaster />

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <FileText className="w-8 h-8 text-[#2b9ccc]" />
          จัดการใบขอซื้อ
        </h1>
      </div>

      <OrdersDataTable 
        data={orders}
        loading={loading}
        onViewOrder={handleViewOrder}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] mx-4" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              ยืนยันการลบใบขอซื้อ
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              คุณต้องการลบใบขอซื้อนี้หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              ใบขอซื้อ: #{selectedOrder?.orderNo || selectedOrder?.id?.slice(-8)} - {selectedOrder?.requesterName || selectedOrder?.requester}
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => setShowDeleteModal(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
              onClick={confirmDeleteOrder}
            >
              ลบใบขอซื้อ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
