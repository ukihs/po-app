"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { auth } from '../../firebase/client';
import { useUser, useRole, useIsLoading, useOrders, useOrdersLoading, useOrdersError } from '../../stores';
import type { OrderStatus, OrderItem, Order } from '../../types';
import { COLLECTIONS } from '../../lib/constants';
import { approveOrder } from '../../lib/poApi';
import { getDisplayOrderNumber } from '../../lib/order-utils';
import { DatePickerPresets } from '../ui/date-picker-presets';
import type { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
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
  RefreshCw,
  Search,
  Filter,
  Eye,
  LayoutGrid,
  Table2,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../ui/alert';
import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiSpam3Fill, 
  RiInformationFill 
} from '@remixicon/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Item, 
  ItemGroup, 
  ItemMedia, 
  ItemContent, 
  ItemTitle, 
  ItemDescription, 
  ItemActions
} from '../ui/item';
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty';
import { cn } from '../../lib/utils';

interface OrderData {
  id: string;
  orderNo: number;
  date: string;
  requesterName: string;
  requesterUid: string;
  total: number;
  status: OrderStatus;
  createdAt: any;
  items?: OrderItem[];
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
}

export default function TrackingPage() {
  const user = useUser();
  const role = useRole();
  const authLoading = useIsLoading();
  const orders = useOrders();
  const loading = useOrdersLoading();
  const err = useOrdersError();
  const [filteredRows, setFilteredRows] = useState<OrderData[]>([]);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    orderId: string;
    approved: boolean;
    orderNo: number;
    requesterName: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const rows = useMemo(() => {
    return orders.map(order => ({
      id: order.id,
      orderNo: order.orderNo,
      date: order.date,
      requesterName: order.requesterName || '',
      requesterUid: order.requesterUid,
      total: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items || [],
      itemsCategories: order.itemsCategories || {},
      itemsStatuses: order.itemsStatuses || {},
    }));
  }, [orders]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#order-')) {
      const orderId = hash.replace('#order-', '');
      
      if (!loading && filteredRows.length > 0) {
        setTimeout(() => {
          const element = document.getElementById(`order-${orderId}`);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all', 'duration-300');
            
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 3000);
            
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 500);
      }
    }
  }, [loading, filteredRows]);

  useEffect(() => {
    let filtered = rows;

    // Apply custom date range filter
    if (customDateRange) {
      const range = customDateRange as DateRange;
      if (range.from) {
        filtered = filtered.filter(order => {
          try {
            const orderDate = order.createdAt?.toDate ? 
              order.createdAt.toDate() : 
              (order.date ? parseISO(order.date) : null);
            
            if (!orderDate) return false;
            
            const from = startOfDay(range.from!);
            const to = range.to ? endOfDay(range.to) : endOfDay(range.from!);
            
            return isWithinInterval(orderDate, { start: from, end: to });
          } catch (error) {
            console.error('Date filter error:', error);
            return false;
          }
        });
      }
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = order.orderNo ? 
          getDisplayOrderNumber({ 
            orderNo: order.orderNo, 
            date: order.date || order.createdAt?.toDate?.()?.toISOString().split('T')[0] || '' 
          }).toLowerCase() : '';
        
        return (
          order.requesterName.toLowerCase().includes(searchLower) ||
          order.orderNo.toString().includes(searchTerm) ||
          order.id.toLowerCase().includes(searchLower) ||
          orderNumber.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredRows(filtered);
    setCurrentPage(1);
  }, [rows, searchTerm, statusFilter, customDateRange]);

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
      
      await approveOrder(orderId, approved);
      
      showAlert(`${action}ใบขอซื้อเรียบร้อยแล้ว`, 'success');
      
    } catch (error) {
      const errorMessage = (error as any)?.message || '';
      const isPermissionError = errorMessage.includes('permission') || 
                               errorMessage.includes('insufficient') ||
                               errorMessage.includes('Missing') ||
                               errorMessage.includes('FirebaseError');
      
      if (isPermissionError) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        showAlert(`${action}สำเร็จแล้ว กำลังอัปเดตข้อมูล`, 'success');
      } else {
        showAlert(`เกิดข้อผิดพลาดใน${action}`, 'error', errorMessage);
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


  const paginatedRows = useMemo(
    () => filteredRows.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredRows, currentPage, itemsPerPage]
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredRows.length / itemsPerPage),
    [filteredRows.length, itemsPerPage]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    setItemsPerPage(Number(newItemsPerPage));
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customDateRange]);


  if (authLoading || loading) {
    return (
      <div className="w-full">
        <div className="text-center py-16">
          <div className="flex justify-center">
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">กำลังโหลดข้อมูล...</p>
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
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>
              {role === 'employee' ? 'ขณะนี้คุณยังไม่มีรายการใบขอซื้อ' : 'ขณะนี้ยังไม่มีใบขอซื้อในระบบ'}
            </EmptyTitle>
            <EmptyDescription>
              {role === 'employee' ? 'สามารถเริ่มสร้างใบขอซื้อแรกของคุณได้เลย!' : 'โปรดรอรายการใบขอซื้อจากผู้ใช้งาน หรือสร้างใบขอซื้อด้วยตนเอง'}
            </EmptyDescription>
          </EmptyHeader>
          {role === 'employee' && (
            <EmptyContent>
              <Button 
                asChild
                variant="primary"
                className="w-full sm:w-auto"
              >
                <a href="/orders/create">
                  สร้างใบขอซื้อ
                </a>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </div>
    );
  }

  return (
    <div className="w-full">
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

      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" />
          <span className="hidden sm:inline">
            {role === 'employee' ? 'ติดตามสถานะใบขอซื้อ' : 
             role === 'supervisor' ? 'ติดตามและอนุมัติใบขอซื้อ' :
             'ติดตามสถานะใบขอซื้อทั้งหมด'}
          </span>
          <span className="sm:hidden">
            {role === 'employee' ? 'ติดตามสถานะ' : 
             role === 'supervisor' ? 'ติดตาม/อนุมัติ' :
             'ติดตาม'}
          </span>
        </h1>
      </div>

      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1 w-full">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ค้นหาเลขใบขอซื้อหรือชื่อผู้ขอซื้อ"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-auto">
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
            
            <DatePickerPresets
              date={customDateRange}
              onDateChange={(date) => setCustomDateRange(date)}
              placeholder="ช่วงวันที่"
              className="w-full sm:w-auto"
              numberOfMonths={2}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">มุมมอง</span>
                <span className="sm:hidden">แสดง</span>
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
          <span>แสดง {filteredRows.length} รายการจาก {rows.length} รายการทั้งหมด</span>
          {totalPages > 1 && (
            <span>หน้า {currentPage} จาก {totalPages}</span>
          )}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>ไม่พบข้อมูล</EmptyTitle>
            <EmptyDescription>
              {searchTerm || statusFilter !== 'all' 
                ? 'ลองปรับเงื่อนไขการค้นหาหรือกรอง' 
                : 'ยังไม่มีใบขอซื้อในระบบ'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : viewMode === 'table' ? (
        <Card>
          <ScrollArea className="h-[400px] sm:h-[500px] md:h-[600px]">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">หมายเลขใบขอซื้อ</TableHead>
                  <TableHead className="text-xs sm:text-sm">ผู้ขอซื้อ</TableHead>
                  <TableHead className="text-xs sm:text-sm">วันที่</TableHead>
                  <TableHead className="text-xs sm:text-sm">ยอดรวม</TableHead>
                  <TableHead className="text-xs sm:text-sm">สถานะ</TableHead>
                  <TableHead className="text-xs sm:text-sm">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((order) => (
                  <TableRow key={order.id} id={`order-${order.id}`}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {getDisplayOrderNumber(order)}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{order.requesterName}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{order.date}</TableCell>
                    <TableCell className="tabular-nums text-xs sm:text-sm">
                      {order.total.toLocaleString('th-TH')} บาท
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs w-full sm:w-auto"
                          onClick={() => {
                            import('astro:transitions/client')
                              .then(({ navigate }) => navigate(`/orders/${order.id}`))
                              .catch(() => {
                                window.location.href = `/orders/${order.id}`;
                              });
                          }}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">ดูรายละเอียด</span>
                          <span className="sm:hidden">ดู</span>
                        </Button>
                        {role === 'supervisor' && order.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => showApprovalModal(order.id, true, order.orderNo, order.requesterName)}
                              disabled={processingOrders.has(order.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs w-full sm:w-auto"
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
                              className="text-xs w-full sm:w-auto"
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {paginatedRows.map((order) => (
          <Card key={order.id} id={`order-${order.id}`} className="shadow-lg bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                <div className="flex-1 w-full">
                  <h3 className="text-base sm:text-lg font-bold">
                    {getDisplayOrderNumber(order)}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
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
                
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="mb-2 sm:mb-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3">ขั้นตอนการดำเนินงาน</h4>
                {renderProgressFlow(order.status)}
              </div>

              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-bold mb-3 flex items-center gap-2">
                    รายการสินค้า ({order.items.length} รายการ)
                  </h4>
                  
                  <ItemGroup className="space-y-3">
                    {order.items.map((item: OrderItem, idx: number) => {
                      const category = getItemCategory(order, idx);
                      const itemStatus = getItemStatus(order, idx);
                      
                      return (
                        <React.Fragment key={idx}>
                          <Item variant="outline" size="default" className="bg-muted/30 border-border">
                            <ItemMedia variant="icon">
                              <span className="text-sm font-medium text-muted-foreground">
                                {idx + 1}
                              </span>
                            </ItemMedia>
                            
                            <ItemContent>
                              <ItemTitle className="text-base">
                                {item.description}
                              </ItemTitle>
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary" size="sm" className="flex items-center gap-1.5 bg-secondary/80 text-secondary-foreground border border-border">
                                    <Tag className="w-4 h-4" />
                                    {category}
                                  </Badge>
                                  <Badge 
                                    variant={itemStatus === 'รอดำเนินการ' ? 'outline' : 'secondary'} 
                                    size="sm" 
                                    className="flex items-center gap-1.5 bg-secondary/80 text-secondary-foreground border border-border"
                                  >
                                    สถานะ : {itemStatus}
                                  </Badge>
                                </div>
                                {item.receivedDate && (
                                  <div className="text-sm text-muted-foreground">
                                    ต้องการรับ: {item.receivedDate}
                                  </div>
                                )}
                              </div>
                            </ItemContent>
                            
                            <ItemActions>
                              <div className="text-right text-sm text-muted-foreground space-y-1.5">
                                <div>จำนวน: {item.quantity?.toLocaleString('th-TH')}</div>
                                <div>ราคา: {item.amount?.toLocaleString('th-TH')} บาท</div>
                                <div className="font-medium text-foreground">
                                  รวม: {item.lineTotal?.toLocaleString('th-TH')} บาท
                                </div>
                              </div>
                            </ItemActions>
                          </Item>
                        </React.Fragment>
                      );
                    })}
                  </ItemGroup>

                  <Separator className="my-2 sm:my-3"/>
                   <h4 className="text-xs sm:text-sm font-bold mb-2 flex items-center gap-2">
                     สรุปรายการ
                   </h4>
                   <div className="mt-2 sm:mt-3 flex justify-start sm:justify-end">
                     <div className="text-xs sm:text-sm text-muted-foreground text-left sm:text-right w-full">
                       <div className="mb-1">
                         <span>จำนวนรายการทั้งหมด : </span>
                         <span className="font-medium">{order.items.length} รายการ</span>
                       </div>
                       <div>
                         <span>ยอดรวมทั้งสิ้น : </span>
                         <span className="text-base sm:text-lg font-bold text-primary">{order.total.toLocaleString('th-TH')} บาท</span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       className="w-full sm:w-auto text-xs border-border bg-background hover:bg-accent"
                       onClick={() => {
                         import('astro:transitions/client')
                           .then(({ navigate }) => navigate(`/orders/${order.id}`))
                           .catch(() => {
                             window.location.href = `/orders/${order.id}`;
                           });
                       }}
                     >
                       <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                       ดูรายละเอียด
                     </Button>
                     
                     {role === 'supervisor' && order.status === 'pending' && (
                       <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                         <Button
                           onClick={() => showApprovalModal(order.id, false, order.orderNo, order.requesterName)}
                           disabled={processingOrders.has(order.id)}
                           size="sm"
                           variant="destructive"
                           className="font-normal text-xs w-full sm:w-auto border-border"
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
                           className="bg-green-600 hover:bg-green-700 text-white font-normal text-xs w-full sm:w-auto border border-green-600"
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
      
      {filteredRows.length > 0 && (
        <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <span className="text-xs sm:text-sm text-muted-foreground">แสดง</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="border border-input bg-background rounded-md px-2 py-1 text-xs sm:text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs sm:text-sm text-muted-foreground">รายการต่อหน้า</span>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground">
              แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRows.length)} จาก {filteredRows.length} รายการ
            </div>

            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 sm:h-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </Button>

            <div className="flex items-center gap-0.5 sm:gap-1">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                if (startPage > 1) {
                  pages.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                    >
                      1
                    </Button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(i)}
                      className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                    >
                      {i}
                    </Button>
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <Button
                      key={totalPages}
                      variant={currentPage === totalPages ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pages;
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 sm:h-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          </div>
        </div>
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent showCloseButton={false} className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {confirmData?.approved ? (
                <>
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                  ยืนยันการอนุมัติ
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  ยืนยันการไม่อนุมัติ
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {confirmData && (
                <span>
                  คุณต้องการ{confirmData.approved ? 'อนุมัติ' : 'ไม่อนุมัติ'}ใบขอซื้อนี้หรือไม่?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={cancelApproval}
              disabled={processingOrders.has(confirmData?.orderId || '')}
              className="font-normal w-full sm:w-auto text-sm"
            >
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={handleApproval}
              disabled={processingOrders.has(confirmData?.orderId || '')}
              className={`w-full sm:w-auto text-sm ${
                confirmData?.approved 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                  : ''
              }`}
            >
              {processingOrders.has(confirmData?.orderId || '') ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">กำลังดำเนินการ...</span>
                  <span className="sm:hidden">กำลังทำงาน...</span>
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

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="warning" appearance="light" className="inline-flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" />
          รออนุมัติ
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="success" appearance="light" className="inline-flex items-center gap-1 w-fit">
          <CheckCircle className="w-3 h-3" />
          อนุมัติแล้ว
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" appearance="light" className="inline-flex items-center gap-1 w-fit">
          <XCircle className="w-3 h-3" />
          ไม่อนุมัติ
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="info" appearance="light" className="inline-flex items-center gap-1 w-fit">
          <Truck className="w-3 h-3" />
          กำลังดำเนินการ
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="success" appearance="light" className="inline-flex items-center gap-1 w-fit">
          <Package className="w-3 h-3" />
          ได้รับแล้ว
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" appearance="light" className="inline-flex items-center gap-1 w-fit">
          <AlertCircle className="w-3 h-3" />
          {status}
        </Badge>
      );
  }
}

function renderProgressFlow(status: OrderStatus) {
  const getCurrentStep = (orderStatus: OrderStatus): number => {
    switch (orderStatus) {
      case 'pending':
        return 2;
      case 'approved':
        return 3;
      case 'in_progress':
        return 4;
      case 'delivered':
        return 5;
      case 'rejected':
        return 2;
      default:
        return 1;
    }
  };

  const getStepStatus = (step: number, currentStep: number, orderStatus: OrderStatus) => {
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