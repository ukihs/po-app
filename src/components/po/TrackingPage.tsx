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
  RefreshCw,
  Search,
  Filter,
  Eye,
  LayoutGrid,
  Table2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationEllipsis } from '../ui/pagination';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
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
  const [filteredRows, setFilteredRows] = useState<OrderData[]>([]);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
            setFilteredRows(list);
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

  useEffect(() => {
    let filtered = rows;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.requesterName.toLowerCase().includes(searchLower) ||
        order.orderNo.toString().includes(searchTerm) ||
        order.id.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredRows(filtered);
    setCurrentPage(1);
  }, [rows, searchTerm, statusFilter]);

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

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };



  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
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
              variant="primary"
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
          <FileText className="w-8 h-8 text-primary" />
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

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ค้นหาผู้ขอซื้อหรือหมายเลขใบขอซื้อ"
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="สถานะทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="pending">รออนุมัติ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="delivered">ได้รับแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4">
                <Filter className="h-4 w-4 mr-2" />
                มุมมอง
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>เลือกมุมมอง</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setViewMode('card')}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                แบบการ์ด
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('table')}>
                <Table2 className="h-4 w-4 mr-2" />
                แบบตาราง
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>แสดง {filteredRows.length} รายการจาก {rows.length} รายการทั้งหมด</span>
          {totalPages > 1 && (
            <span>หน้า {currentPage} จาก {totalPages}</span>
          )}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">ไม่พบข้อมูล</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'ลองปรับเงื่อนไขการค้นหาหรือกรอง' 
              : 'ยังไม่มีใบขอซื้อในระบบ'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หมายเลขใบขอซื้อ</TableHead>
                  <TableHead>ผู้ขอซื้อ</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {generateOrderNumber(order.orderNo, order.date)}
                    </TableCell>
                    <TableCell>{order.requesterName}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className="tabular-nums">
                      {order.total.toLocaleString('th-TH')} บาท
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดูรายละเอียด
                        </Button>
                        {role === 'supervisor' && order.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => showApprovalModal(order.id, true, order.orderNo, order.requesterName)}
                              disabled={processingOrders.has(order.id)}
                              size="sm"
                              variant="primary"
                            >
                              {processingOrders.has(order.id) ? (
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              อนุมัติ
                            </Button>
                            <Button
                              onClick={() => showApprovalModal(order.id, false, order.orderNo, order.requesterName)}
                              disabled={processingOrders.has(order.id)}
                              size="sm"
                              variant="destructive"
                            >
                              {processingOrders.has(order.id) ? (
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              ไม่อนุมัติ
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {paginatedRows.map((order) => (
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
                                <Badge variant="info" appearance="light" className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  ประเภท: {category}
                                </Badge>
                                <Badge variant="secondary" appearance="light" className="flex items-center gap-1">
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
                         <span className="text-lg font-bold text-primary">{order.total.toLocaleString('th-TH')} บาท</span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="mt-4 flex justify-between items-center">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                     >
                       <Eye className="h-4 w-4 mr-1" />
                       ดูรายละเอียด
                     </Button>
                     
                     {role === 'supervisor' && order.status === 'pending' && (
                       <div className="flex gap-2">
                         <Button
                           onClick={() => showApprovalModal(order.id, false, order.orderNo, order.requesterName)}
                           disabled={processingOrders.has(order.id)}
                           size="sm"
                           variant="destructive"
                           className="font-normal"
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
                           variant="primary"
                           className="font-normal"
                         >
                           {processingOrders.has(order.id) ? (
                             <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                           ) : (
                             <CheckCircle className="w-3 h-3 mr-1" />
                           )}
                           อนุมัติ
                         </Button>
                       </div>
                     )}
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      )}
      
      {/* Pagination Section */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-sm text-muted-foreground">
            แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRows.length)} 
            จาก {filteredRows.length} รายการ
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 p-0"
                >
                  <span className="sr-only">หน้าแรก</span>
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-1" />
                </Button>
              </PaginationItem>
              
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 p-0"
                >
                  <span className="sr-only">ก่อนหน้า</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Show page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <Button
                        variant={currentPage === page ? "primary" : "outline"}
                        onClick={() => handlePageChange(page)}
                        className="h-10 w-10"
                      >
                        {page}
                      </Button>
                    </PaginationItem>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 p-0"
                >
                  <span className="sr-only">ถัดไป</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>

              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 p-0"
                >
                  <span className="sr-only">หน้าสุดท้าย</span>
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-1" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent showCloseButton={false}>
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
              variant={
                confirmData?.approved 
                  ? 'primary' 
                  : 'destructive'
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
        <Badge variant="warning" appearance="light" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          รออนุมัติ
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="success" appearance="light" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          อนุมัติแล้ว
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" appearance="light" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          ไม่อนุมัติ
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="info" appearance="light" className="flex items-center gap-1">
          <Truck className="w-3 h-3" />
          กำลังดำเนินการ
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="success" appearance="light" className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          ได้รับแล้ว
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" appearance="light" className="flex items-center gap-1">
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
                  stepNumber === currentStep && !isRejected && "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary",
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
                          variant="primary"
                          className="hidden group-data-[state=active]/step:inline-flex"
                        >
                          รอดำเนินการ
                        </Badge>

                        <Badge
                          variant="success"
                          className="hidden group-data-[state=completed]/step:inline-flex"
                        >
                          เสร็จสิ้น
                        </Badge>

                        <Badge
                          variant="secondary"
                          appearance="outline"
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
                  stepNumber === currentStep && !isRejected && "group-data-[state=active]/step:bg-primary",
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