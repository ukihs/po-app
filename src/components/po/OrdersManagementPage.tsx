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
import { useUser, useRole, useIsLoading } from '../../stores';
import { FileText, Trash2, AlertTriangle, RefreshCw, Eye, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody } from '../ui/dialog';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../ui/empty';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiSpam3Fill, 
  RiInformationFill 
} from '@remixicon/react';
import type { Order, OrderStatus } from '../../types';
import { getDisplayOrderNumber, formatCurrency, getStatusLabel } from '../../lib/order-utils';
import { ORDER_STATUS_LABELS } from '../../lib/constants';
import OrdersManagementDataTable from './OrdersManagementDataTable';

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    description?: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    description: ''
  });
  
  const user = useUser();
  const role = useRole();
  const authLoading = useIsLoading();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      import('astro:transitions/client')
        .then(({ navigate }) => navigate('/login'))
        .catch(() => {
          window.location.href = '/login';
        });
      return;
    }

    if (role !== 'admin') {
      setErr('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      setLoading(false);
      return;
    }

    const qRef = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
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

    return () => {
      unsub();
    };
  }, [user, role, authLoading]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', description?: string) => {
    setAlertState({
      show: true,
      type,
      title: message,
      description
    });

    const duration = type === 'error' ? 5000 : 4000;
    setTimeout(() => {
      setAlertState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          variant: 'success' as const,
          appearance: 'light' as const,
          IconComponent: RiCheckboxCircleFill
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          appearance: 'light' as const,
          IconComponent: RiErrorWarningFill
        };
      case 'warning':
        return {
          variant: 'warning' as const,
          appearance: 'light' as const,
          IconComponent: RiSpam3Fill
        };
      case 'info':
      default:
        return {
          variant: 'info' as const,
          appearance: 'light' as const,
          IconComponent: RiInformationFill
        };
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" appearance="light">{ORDER_STATUS_LABELS[status]}</Badge>;
      case 'approved':
        return <Badge variant="success" appearance="light">{ORDER_STATUS_LABELS[status]}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" appearance="light">{ORDER_STATUS_LABELS[status]}</Badge>;
      case 'in_progress':
        return <Badge variant="info" appearance="light">{ORDER_STATUS_LABELS[status]}</Badge>;
      case 'delivered':
        return <Badge variant="success" appearance="light">{ORDER_STATUS_LABELS[status]}</Badge>;
      default:
        return <Badge variant="secondary" appearance="light">{ORDER_STATUS_LABELS[status]}</Badge>;
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return '—';
    return ts?.toDate
      ? ts.toDate().toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—';
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
      }
      
      showAlert('ลบใบขอซื้อและการแจ้งเตือนที่เกี่ยวข้องสำเร็จ', 'success');
      setShowDeleteModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Error deleting order:', error);
      
      const errorMessage = error?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
      showAlert('ไม่สามารถลบใบขอซื้อได้', 'error', errorMessage);
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

  if (!orders.length && !loading) {
    return (
      <div className="w-full">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>ยังไม่มีใบขอซื้อในระบบ</EmptyTitle>
            <EmptyDescription>
              รอใบขอซื้อจากผู้ใช้งาน
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[#2b9ccc]" />
          จัดการใบขอซื้อ
        </h1>
      </div>

      {alertState.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert 
            variant={getAlertConfig(alertState.type).variant}
            appearance={getAlertConfig(alertState.type).appearance}
            close
            onClose={() => setAlertState(prev => ({ ...prev, show: false }))}
          >
            <AlertIcon>
              {React.createElement(getAlertConfig(alertState.type).IconComponent, { className: "h-4 w-4" })}
            </AlertIcon>
            <AlertTitle>{alertState.title}</AlertTitle>
            {alertState.description && (
              <AlertDescription>{alertState.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}

      <OrdersManagementDataTable 
        data={orders}
        loading={loading}
        onViewOrder={handleViewOrder}
        onDeleteOrder={handleDeleteOrder}
        onShowAlert={showAlert}
      />

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              รายละเอียดใบขอซื้อ
            </DialogTitle>
            <DialogDescription className="text-sm">
              ข้อมูลโดยละเอียดของใบขอซื้อ {selectedOrder ? getDisplayOrderNumber(selectedOrder) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <DialogBody>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      ข้อมูลทั่วไป
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">เลขที่ใบขอซื้อ</p>
                        <p className="font-semibold">{getDisplayOrderNumber(selectedOrder)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">วันที่</p>
                        <p className="font-medium">{selectedOrder.date || formatTimestamp(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">ผู้ขอซื้อ</p>
                        <p className="font-medium">{selectedOrder.requesterName || selectedOrder.requester || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">สถานะ</p>
                        <div>{getStatusBadge(selectedOrder.status)}</div>
                      </div>
                      {selectedOrder.procurementStatus && (
                        <div>
                          <p className="text-muted-foreground mb-1">สถานะการจัดซื้อ</p>
                          <Badge variant="info" appearance="outline">{selectedOrder.procurementStatus}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      รายการสินค้า ({selectedOrder.items?.length || 0} รายการ)
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>รายการ</TableHead>
                            <TableHead className="text-center">วันที่ต้องการ</TableHead>
                            <TableHead className="text-center">ประเภท</TableHead>
                            <TableHead className="text-right">จำนวน</TableHead>
                            <TableHead className="text-right">ราคา/หน่วย</TableHead>
                            <TableHead className="text-right">รวม</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items?.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-center">{idx + 1}</TableCell>
                              <TableCell className="max-w-[200px]">
                                <div className="line-clamp-2">{item.description}</div>
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {item.receivedDate || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" size="sm">{item.itemType}</Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                              <TableCell className="text-right tabular-nums">{item.amount.toLocaleString('th-TH')}</TableCell>
                              <TableCell className="text-right tabular-nums font-medium">
                                {item.lineTotal.toLocaleString('th-TH')}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={6} className="text-right font-semibold">
                              ยอดรวมทั้งหมด
                            </TableCell>
                            <TableCell className="text-right font-bold text-lg tabular-nums">
                              {(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString('th-TH')} บาท
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                    {(selectedOrder.approvedByName || selectedOrder.rejectedReason) && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-base font-semibold">ข้อมูลการอนุมัติ</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {selectedOrder.approvedByName && (
                              <>
                                <div>
                                  <p className="text-muted-foreground mb-1">ผู้อนุมัติ</p>
                                  <p className="font-medium">{selectedOrder.approvedByName}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">วันที่อนุมัติ</p>
                                  <p className="font-medium">{formatTimestamp(selectedOrder.approvedAt)}</p>
                                </div>
                              </>
                            )}
                            {selectedOrder.rejectedReason && (
                              <div className="sm:col-span-2">
                                <p className="text-muted-foreground mb-1">เหตุผลที่ไม่อนุมัติ</p>
                                <p className="font-medium text-destructive">{selectedOrder.rejectedReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </ScrollArea>
            </DialogBody>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ยืนยันการลบ */}
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
              ใบขอซื้อ: {selectedOrder ? getDisplayOrderNumber(selectedOrder) : 'N/A'} - {selectedOrder?.requesterName || selectedOrder?.requester}
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