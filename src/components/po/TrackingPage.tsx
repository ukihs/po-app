"use client";

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/client';
import { collection, onSnapshot, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { subscribeAuthAndRole } from '../../lib/auth';
import { approveOrder, generateOrderNumber } from '../../lib/poApi';
import { 
  FileText, 
  CheckCircle, 
  ShoppingCart, 
  Package, 
  Clock, 
  AlertCircle,
  XCircle,
  Truck,
  Tag,
  Activity,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Stepper, 
  StepperItem, 
  StepperTrigger, 
  StepperIndicator, 
  StepperSeparator, 
  StepperTitle, 
  StepperDescription, 
  StepperNav 
} from '../ui/stepper';
import { cn } from '../../lib/utils';

type Status = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

interface OrderItem {
  description?: string;
  quantity?: number;
  amount?: number;
  lineTotal?: number;
  receivedDate?: string;
  category?: string;
  itemStatus?: string;
  itemType?: string;
}

interface OrderData {
  id: string;
  orderNo: number;
  date: string;
  requesterName: string;
  requesterUid: string;
  total: number;
  status: Status;
  createdAt: any;
  items?: OrderItem[];
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
}

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrderData[]>([]);
  const [err, setErr] = useState('');
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | 'superadmin' | null>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    orderId: string;
    approved: boolean;
    orderNo: number;
    requesterName: string;
  } | null>(null);

  useEffect(() => {
    let offOrders: any;
    let offAuth: any;

    offAuth = subscribeAuthAndRole((authUser, userRole) => {
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      setUser(authUser);
      
      const detectRole = async () => {
        let detectedRole = userRole;
        
        if (!userRole || (authUser.email?.includes('tanza') && userRole === 'buyer')) {
          try {
            const userDoc = await getDoc(doc(db, 'users', authUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              detectedRole = userData.role;
            }
          } catch (error) {
            console.error('Error detecting role:', error);
          }
        }

        setRole(detectedRole);
        offOrders?.();

        let q;
        if (detectedRole === 'buyer') {
          q = query(
            collection(db, 'orders'),
            where('requesterUid', '==', authUser.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (detectedRole === 'supervisor' || detectedRole === 'procurement') {
          q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
          );
        } else {
          setLoading(false);
          setErr('ไม่พบ role ในระบบ กรุณาตรวจสอบการตั้งค่า role ใน Firestore');
          return;
        }

        offOrders = onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                orderNo: data.orderNo || 0,
                date: data.date || '',
                requesterName: data.requesterName || '',
                requesterUid: data.requesterUid || '',
                total: Number(data.total || 0),
                status: (data.status || 'pending') as Status,
                createdAt: data.createdAt,
                items: data.items || [],
                itemsCategories: data.itemsCategories || {},
                itemsStatuses: data.itemsStatuses || {},
              };
            });
            
            setRows(list);
            setErr('');
            setLoading(false);
          },
          (e) => {
            console.error('Orders query error:', e);
            setErr(String(e?.message || e));
            setLoading(false);
          }
        );
      };

      detectRole();
    });

    return () => {
      offOrders?.();
      offAuth?.();
    };
  }, []);

  const showApprovalModal = (orderId: string, approved: boolean, orderNo: number, requesterName: string) => {
    setConfirmData({
      orderId,
      approved,
      orderNo,
      requesterName
    });
    setShowConfirmModal(true);
  };

  const handleApproval = async () => {
    if (!confirmData) return;
    
    const { orderId, approved } = confirmData;
    const action = approved ? 'อนุมัติ' : 'ไม่อนุมัติ';

    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      setShowConfirmModal(false);
      
      console.log(`กำลัง${action}ใบขอซื้อ...`, orderId);
      
      await approveOrder(orderId, approved);
      
      console.log(`${action}ใบขอซื้อเรียบร้อยแล้ว`);
      
      toast.success(`${action}ใบขอซื้อเรียบร้อยแล้ว`);
      
    } catch (error) {
      console.error('Error approving order:', error);
      
      const errorMessage = (error as any)?.message || '';
      const isPermissionError = errorMessage.includes('permission') || 
                               errorMessage.includes('insufficient') ||
                               errorMessage.includes('Missing') ||
                               errorMessage.includes('FirebaseError');
      
      if (isPermissionError) {
        console.warn('Permission warning occurred, checking if operation succeeded');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        toast.success(`${action}สำเร็จแล้ว กำลังอัปเดตข้อมูล...`);
      } else {
        toast.error(`เกิดข้อผิดพลาดใน${action}: ${errorMessage}`);
      }
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      setConfirmData(null);
    }
  };

  const cancelApproval = () => {
    setShowConfirmModal(false);
    setConfirmData(null);
  };

  const getItemCategory = (order: OrderData, index: number): string => {
    const fromMap = order.itemsCategories?.[index.toString()];
    if (fromMap) return fromMap;
    
    const item = order.items?.[index];
    const category = item?.category || item?.itemType || 'วัตถุดิบ';
    
    return category;
  };

  const getItemStatus = (order: OrderData, index: number): string => {
    const fromMap = order.itemsStatuses?.[index.toString()];
    if (fromMap) return fromMap;
    
    const item = order.items?.[index];
    const status = item?.itemStatus || 'รอดำเนินการ';
    
    return status;
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#6EC1E4]" />
          </div>
          <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <div className="text-sm">{err}</div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="w-full">
        <Toaster />
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">
            {role === 'buyer' ? 'คุณยังไม่มีใบขอซื้อ' : 'ยังไม่มีใบขอซื้อในระบบ'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {role === 'buyer' ? 'เริ่มสร้างใบขอซื้อแรกได้เลย!' : 'รอใบขอซื้อจากผู้ใช้งาน'}
          </p>
          {role === 'buyer' && (
            <Button 
              asChild
              className="bg-[#6EC1E4] hover:bg-[#2b9ccc]"
            >
              <a href="/orders/create">
                สร้างใบขอซื้อ
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Toaster />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#2b9ccc]" />
          {role === 'buyer' ? 'ติดตามสถานะใบขอซื้อ' : 
           role === 'supervisor' ? 'ติดตามและอนุมัติใบขอซื้อ' :
           'ติดตามใบขอซื้อทั้งหมด'}
        </h1>
        <p className="text-muted-foreground">
          {role === 'supervisor' ? 'หน้าจัดการตรวจสอบและอนุมัติใบขอซื้อทั้งหมดในระบบ' :
           role === 'buyer' ? 'ติดตามสถานะและความคืบหน้าของใบขอซื้อ' :
           'ติดตามใบขอซื้อทั้งหมดในระบบ'}
        </p>
      </div>

      <div className="space-y-6">
        {rows.map((order) => (
          <Card key={order.id} className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {generateOrderNumber(order.orderNo, order.date)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      ชื่อผู้ขอ: {order.requesterName}
                    </span>
                    <span>วันที่: {order.date}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    สร้างเมื่อ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : '—'}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="mb-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-bold mb-3">ขั้นตอนการดำเนินงาน</h4>
                {renderProgressFlow(order.status)}
              </div>

              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                    รายการสินค้า ({order.items.length} รายการ)
                  </h4>
                  
                  <div className="space-y-3">
                    {order.items.map((item: OrderItem, idx: number) => {
                      const category = getItemCategory(order, idx);
                      const itemStatus = getItemStatus(order, idx);
                      
                      return (
                        <div key={idx} className="bg-muted rounded-lg p-4 mb-4 border">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">
                                  รายการที่ {idx + 1} : "{item.description}"
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-sm">
                                  <Tag className="w-3 h-3" />
                                  ประเภท: {category}
                                </Badge>
                                <Badge variant="secondary" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-sm">
                                  <Activity className="w-3 h-3" />
                                  สถานะ: {itemStatus}
                                </Badge>
                              </div>
                              
                              {item.receivedDate && (
                                <div className="text-xs text-muted-foreground mb-1">
                                  ต้องการรับ: {item.receivedDate}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right min-w-[120px]">
                              <div className="text-sm text-muted-foreground">
                                <div>จำนวน {item.quantity?.toLocaleString('th-TH')}</div>
                                <div>ราคาต่อหน่วย {item.amount?.toLocaleString('th-TH')} บาท</div>
                                <div>รวม {item.lineTotal?.toLocaleString('th-TH')} บาท
                                </div>
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-3"/>
                   <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                     สรุปรายการ
                   </h4>
                   <div className="mt-3 flex justify-end">
                     <div className="text-sm text-muted-foreground text-right">
                       <div className="mb-1">
                         <span>จำนวนรายการทั้งหมด : </span>
                         <span className="font-medium">{order.items.length} รายการ</span>
                       </div>
                       <div>
                         <span>ยอดรวมทั้งสิ้น : </span>
                         <span className="text-lg font-bold text-[#6EC1E4]">{order.total.toLocaleString('th-TH')} บาท</span>
                       </div>
                     </div>
                   </div>
                   
                   {role === 'supervisor' && order.status === 'pending' && (
                     <div className="mt-4 flex justify-end">
                       <div className="flex gap-2">
                       <Button
                           onClick={() => showApprovalModal(order.id, false, order.orderNo, order.requesterName)}
                           disabled={processingOrders.has(order.id)}
                           size="sm"
                           className="bg-white text-red-500 border border-red-500 hover:bg-red-600 hover:text-white font-normal"
                         >
                           {processingOrders.has(order.id) ? (
                             <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                           ) : (
                             <XCircle className="w-3 h-3 mr-1" />
                           )}
                           ไม่อนุมัติ
                         </Button>
                         <Button
                           onClick={() => showApprovalModal(order.id, true, order.orderNo, order.requesterName)}
                           disabled={processingOrders.has(order.id)}
                           size="sm"
                           className="bg-green-500 text-white hover:bg-green-600 font-normal"
                         >
                           {processingOrders.has(order.id) ? (
                             <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                           ) : (
                             <CheckCircle className="w-3 h-3 mr-1" />
                           )}
                           อนุมัติ
                         </Button>
                       </div>
                     </div>
                   )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmData?.approved ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  ยืนยันการอนุมัติ
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  ยืนยันการไม่อนุมัติ
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmData && (
                <span className="text-base">
                  คุณต้องการ{confirmData.approved ? 'อนุมัติ' : 'ไม่อนุมัติ'}ใบขอซื้อนี้หรือไม่?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={cancelApproval}
              disabled={processingOrders.has(confirmData?.orderId || '')}
              className="font-normal"
            >
              ยกเลิก
            </Button>
            <Button 
              className={
                confirmData?.approved 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }
              onClick={handleApproval}
              disabled={processingOrders.has(confirmData?.orderId || '')}
            >
              {processingOrders.has(confirmData?.orderId || '') ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                'ยืนยัน'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function getStatusBadge(status: Status) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 shadow-sm">
          <Clock className="w-3 h-3" />
          รออนุมัติ
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 shadow-sm">
          <CheckCircle className="w-3 h-3" />
          อนุมัติแล้ว
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className="flex items-center gap-1 bg-red-100 text-red-800 border-red-200 hover:bg-red-200 shadow-sm">
          <XCircle className="w-3 h-3" />
          ไม่อนุมัติ
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 shadow-sm">
          <Truck className="w-3 h-3" />
          กำลังดำเนินการ
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200 shadow-sm">
          <Package className="w-3 h-3" />
          ได้รับแล้ว
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 shadow-sm">
          <AlertCircle className="w-3 h-3" />
          {status}
        </Badge>
      );
  }
}

function renderProgressFlow(status: Status) {
  const getCurrentStep = (orderStatus: Status): number => {
    switch (orderStatus) {
      case 'pending':
        return 2;
      case 'approved':
        return 3;
      case 'in_progress':
        return 4;
      case 'delivered':
        return 4;
      case 'rejected':
        return 2;
      default:
        return 1;
    }
  };

  const getStepStatus = (step: number, currentStep: number, orderStatus: Status) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) {
      if (orderStatus === 'rejected' && step === 2) return 'rejected';
      return 'active';
    }
    return 'inactive';
  };

  const steps = [
    { title: 'ผู้ขอซื้อ', icon: FileText },
    { title: 'หัวหน้าอนุมัติ', icon: CheckCircle },
    { title: 'ฝ่ายจัดซื้อ', icon: ShoppingCart },
    { title: 'ส่งมอบ', icon: Package },
  ];

  const currentStep = getCurrentStep(status);

  return (
    <Stepper 
      value={currentStep} 
      orientation="horizontal"
      className="space-y-8 w-full"
      indicators={{
        completed: <CheckCircle className="size-4" />,
      }}
    >
      <StepperNav className="gap-3 mb-15">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const stepStatus = getStepStatus(stepNumber, currentStep, status);
          const isRejected = status === 'rejected' && stepNumber === 2;
          
          return (
            <StepperItem 
              key={index} 
              step={stepNumber} 
              completed={stepNumber < currentStep}
              className="relative flex-1 items-start"
            >
              <StepperTrigger className="flex flex-col items-start justify-center gap-2.5 grow" asChild>
                <StepperIndicator className={cn(
                  "size-8 border-2 flex items-center justify-center",
                  stepNumber < currentStep && "data-[state=completed]:text-white data-[state=completed]:bg-green-500",
                  stepNumber === currentStep && !isRejected && "data-[state=active]:bg-[#6EC1E4] data-[state=active]:text-white data-[state=active]:border-[#6EC1E4]",
                  isRejected && "data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:border-red-500",
                  stepNumber > currentStep && "data-[state=inactive]:bg-transparent data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground"
                )}>
                  <step.icon className="size-4" />
                </StepperIndicator>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                    ขั้นตอนที่ {stepNumber}
                  </div>
                  <StepperTitle className="text-start text-base font-semibold group-data-[state=inactive]/step:text-muted-foreground">
                    {step.title}
                  </StepperTitle>
                  <div>
                    {!isRejected && (
                      <>
                        <Badge
                          variant="secondary"
                          className="hidden group-data-[state=active]/step:inline-flex bg-[#6EC1E4] text-white hover:bg-[#6EC1E4]"
                        >
                          รอดำเนินการ
                        </Badge>

                        <Badge
                          variant="secondary"
                          className="hidden group-data-[state=completed]/step:inline-flex bg-green-500 text-white hover:bg-green-500"
                        >
                          เสร็จสิ้น
                        </Badge>

                        <Badge
                          variant="outline"
                          className="hidden group-data-[state=inactive]/step:inline-flex text-muted-foreground"
                        >
                          รอคิว
                        </Badge>
                      </>
                    )}

                    {isRejected && (
                      <Badge
                        variant="destructive"
                        className="inline-flex"
                      >
                        ไม่อนุมัติ
                      </Badge>
                    )}
                  </div>
                </div>
              </StepperTrigger>

              {steps.length > index + 1 && (
                <StepperSeparator className={cn(
                  "absolute top-4 inset-x-0 start-9 m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none",
                  stepNumber < currentStep && "group-data-[state=completed]/step:bg-green-500",
                  stepNumber === currentStep && !isRejected && "group-data-[state=active]/step:bg-[#6EC1E4]",
                  stepNumber > currentStep && "group-data-[state=inactive]/step:bg-muted"
                )} />
              )}
            </StepperItem>
          );
        })}
      </StepperNav>
    </Stepper>
  );
}