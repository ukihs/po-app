"use client";

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Loader2,
  Search,
  ChevronLeft,
  FileText,
  Calendar
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardHeader, CardTable, CardFooter } from '../ui/card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty';

import type { Order, OrderStatus, UserRole } from '../../types';
import { getDisplayOrderNumber } from '../../lib/order-utils';
import type { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { DatePickerPresets } from '../ui/date-picker-presets';

const ITEM_CATEGORIES = ['วัตถุดิบ', 'Software/Hardware', 'เครื่องมือ', 'วัสดุสิ้นเปลือง'] as const;

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'approved',    label: 'อนุมัติแล้ว' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'delivered',   label: 'ได้รับแล้ว' },
];

const STATUS_TH: Record<OrderStatus,string> = {
  pending:'รออนุมัติ', approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ', in_progress:'กำลังดำเนินการ', delivered:'ได้รับแล้ว'
};
const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return <Badge variant="warning" appearance="light">{STATUS_TH[status]}</Badge>;
    case 'approved':
      return <Badge variant="success" appearance="light">{STATUS_TH[status]}</Badge>;
    case 'rejected':
      return <Badge variant="destructive" appearance="light">{STATUS_TH[status]}</Badge>;
    case 'in_progress':
      return <Badge variant="info" appearance="light">{STATUS_TH[status]}</Badge>;
    case 'delivered':
      return <Badge variant="success" appearance="light">{STATUS_TH[status]}</Badge>;
    default:
      return <Badge variant="secondary" appearance="light">{STATUS_TH[status]}</Badge>;
  }
};

const ITEM_STATUS_G1 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ', 'สินค้าเข้าคลัง'] as const;
const ITEM_STATUS_G2 = ['จัดซื้อ', 'ของมาส่ง', 'ส่งมอบของ'] as const;
const getItemStatusOptions = (category?: string) =>
  category === 'วัตถุดิบ' ? ITEM_STATUS_G1 : ITEM_STATUS_G2;

const fmtTS = (ts:any) =>
  ts?.toDate
    ? ts.toDate().toLocaleString('th-TH',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
    : '—';

interface OrdersDataTableProps {
  data: Order[];
  loading: boolean;
  role: UserRole | null;
  expanded: Record<string, boolean>;
  processingKeys: Set<string>;
  drafts: Record<string, Record<number, {category?:string; itemStatus?:string}>>;
  onToggleExpanded: (id: string) => void;
  onSaveOrderStatus: (order: Order, status: OrderStatus) => Promise<void>;
  onSaveItem: (order: Order, idx: number) => Promise<void>;
  onSetDraft: (orderId: string, idx: number, patch: Partial<{category: string; itemStatus: string}>) => void;
  onGetItemValue: (order: Order, idx: number) => {category: string; itemStatus: string};
}


export default function OrdersDataTable({ 
  data, 
  loading, 
  role,
  expanded,
  processingKeys,
  drafts,
  onToggleExpanded,
  onSaveOrderStatus,
  onSaveItem,
  onSetDraft,
  onGetItemValue
}: OrdersDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const filteredData = useMemo(() => {
    let filtered = data;
    
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
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = order.orderNo ? 
          getDisplayOrderNumber({ 
            orderNo: order.orderNo, 
            date: order.date || order.createdAt?.toDate?.()?.toISOString().split('T')[0] || '' 
          }).toLowerCase() : '';
        
        return (
          order.requesterName?.toLowerCase().includes(search) ||
          order.requester?.toLowerCase().includes(search) ||
          order.id.toLowerCase().includes(search) ||
          order.orderNo?.toString().includes(search) ||
          orderNumber.includes(search)
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    return filtered;
  }, [data, searchTerm, statusFilter, customDateRange]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const orderNumbers = useMemo(() => {
    const numbers: Record<string, string> = {};
    paginatedData.forEach(order => {
      numbers[order.id] = getDisplayOrderNumber(order);
    });
    return numbers;
  }, [paginatedData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customDateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary"></Loader2>
        <span className="ml-4 text-lg">โหลดข้อมูลใบสั่งซื้อ...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>ไม่พบข้อมูลใบสั่งซื้อ</EmptyTitle>
            <EmptyDescription>
              ยังไม่มีใบสั่งซื้อในระบบ หรือไม่มีข้อมูลที่ตรงตามเงื่อนไขการค้นหา
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="mt-4"
            >
              <Search className="h-4 w-4 mr-2" />
              ล้างการค้นหา
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาใบขอซื้อ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
      </CardHeader>
      <CardTable>
        <ScrollArea className="h-[400px] sm:h-[500px] md:h-[600px]">
          <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] sm:w-[120px] text-xs sm:text-sm">เลขที่ใบขอซื้อ</TableHead>
                  <TableHead className="w-[120px] sm:w-[140px] text-xs sm:text-sm">วันที่</TableHead>
                  <TableHead className="w-[140px] sm:w-[180px] text-xs sm:text-sm">ผู้ขอซื้อ</TableHead>
                  <TableHead className="w-[120px] sm:w-[140px] text-xs sm:text-sm">ยอดรวม</TableHead>
                  <TableHead className="w-[120px] sm:w-[140px] text-xs sm:text-sm">สถานะ</TableHead>
                  <TableHead className="w-[160px] sm:w-[200px] text-xs sm:text-sm">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {paginatedData.map((order) => {
                const isOpen = !!expanded[order.id];
                
                return (
                  <React.Fragment key={order.id}>
                    <TableRow className="hover">
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="inline-flex items-center gap-1 h-auto p-0 font-semibold text-sm sm:text-base"
                          onClick={() => onToggleExpanded(order.id)}
                        >
                          {isOpen ? <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                          {orderNumbers[order.id] || 'PR000'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground text-xs sm:text-sm">
                          {order.date || fmtTS(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-normal text-xs sm:text-sm">
                          {order.requesterName || order.requester || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="tabular-nums text-xs sm:text-sm">
                          {((order.totalAmount ?? order.total ?? 0) as number).toLocaleString('th-TH')} บาท
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs sm:text-sm">
                          {getStatusBadge(order.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {role === 'procurement' ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => onSaveOrderStatus(order, value as OrderStatus)}
                              disabled={processingKeys.has(order.id) || order.status === 'rejected'}
                            >
                              <SelectTrigger className="w-[140px] sm:w-[180px] text-xs sm:text-sm">
                               <SelectValue placeholder="เลือกสถานะ…" />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUS_OPTIONS.map(x=>(
                                  <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {processingKeys.has(order.id) && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs sm:text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-muted/30 p-2 sm:p-4">
                            <div className="rounded-md border bg-card overflow-hidden">
                              <div className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold border-b bg-muted/50">รายการสินค้า</div>
                              <div className="overflow-x-auto">
                                <Table className="min-w-[600px]">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs sm:text-sm">รายละเอียด</TableHead>
                                      <TableHead className="text-xs sm:text-sm">จำนวน</TableHead>
                                      <TableHead className="text-xs sm:text-sm">ราคาต่อหน่วย</TableHead>
                                      <TableHead className="text-xs sm:text-sm">รวมทั้งสิ้น</TableHead>
                                      <TableHead className="text-xs sm:text-sm">ประเภทสินค้า</TableHead>
                                      <TableHead className="text-xs sm:text-sm">สถานะรายการ</TableHead>
                                      {role === 'procurement' && (
                                        <TableHead className="text-xs sm:text-sm"></TableHead>
                                      )}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                  {(order.items||[]).map((it, idx)=>{
                                    const val = onGetItemValue(order, idx);
                                    const options = getItemStatusOptions(val.category);

                                    return (
                                      <TableRow key={idx}>
                                        <TableCell className="text-xs sm:text-sm">{it.description || '-'}</TableCell>
                                        <TableCell className="text-xs sm:text-sm">{it.quantity ?? '-'}</TableCell>
                                        <TableCell className="text-xs sm:text-sm">{it.amount!=null ? Number(it.amount).toLocaleString('th-TH') : '-'}</TableCell>
                                        <TableCell className="text-xs sm:text-sm">{it.lineTotal!=null ? Number(it.lineTotal).toLocaleString('th-TH') : '-'}</TableCell>

                                        <TableCell>
                                          {role === 'procurement' ? (
                                            <Select
                                              value={val.category}
                                              onValueChange={(value)=>onSetDraft(order.id, idx, {category: value})}
                                              disabled={processingKeys.has(`${order.id}:${idx}`) || order.status === 'rejected'}
                                            >
                                              <SelectTrigger className="text-xs sm:text-sm">
                                                <SelectValue placeholder="เลือกประเภท…" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {ITEM_CATEGORIES.map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <Badge variant={val.category ? "info" : "secondary"} appearance="light" className="text-xs">
                                              {val.category || 'ยังไม่ระบุ'}
                                            </Badge>
                                          )}
                                        </TableCell>

                                        <TableCell>
                                          {role === 'procurement' ? (
                                            <Select
                                              value={val.itemStatus}
                                              onValueChange={(value)=>onSetDraft(order.id, idx, {itemStatus: value})}
                                              disabled={processingKeys.has(`${order.id}:${idx}`) || order.status === 'rejected'}
                                            >
                                              <SelectTrigger className="text-xs sm:text-sm">
                                               <SelectValue placeholder="เลือกสถานะ…" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {options.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <Badge variant={val.itemStatus ? "secondary" : "secondary"} appearance="light" className="text-xs">
                                              {val.itemStatus || 'รอดำเนินการ'}
                                            </Badge>
                                          )}
                                        </TableCell>

                                        {role === 'procurement' && (
                                          <TableCell>
                                            <Button
                                              variant="primary"
                                              size="sm"
                                              onClick={()=>onSaveItem(order, idx)}
                                              disabled={processingKeys.has(`${order.id}:${idx}`) || order.status === 'rejected'}
                                              className="font-normal text-xs sm:text-sm"
                                            >
                                              {processingKeys.has(`${order.id}:${idx}`) && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-1" />}
                                              บันทึก
                                            </Button>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  })}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardTable>
      <CardFooter>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          {/* Left - Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">แสดง</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[70px] sm:w-[80px] h-7 sm:h-8 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs sm:text-sm text-muted-foreground">รายการ</span>
          </div>

          {/* Center - Item count */}
          <div className="text-xs sm:text-sm text-muted-foreground">
            {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} จาก {filteredData.length}
          </div>

          {/* Right - Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <span className="sr-only">ก่อนหน้า</span>
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              
              {/* Page numbers with ellipsis */}
              {(() => {
                const pages = [];
                const maxVisible = 5;
                
                if (totalPages <= maxVisible) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={currentPage === i ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm"
                      >
                        {i}
                      </Button>
                    );
                  }
                } else {
                  // Always show first page
                  pages.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm"
                    >
                      1
                    </Button>
                  );
                  
                  // Add ellipsis after first page if needed
                  if (currentPage > 3) {
                    pages.push(
                      <span key="ellipsis1" className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  
                  // Show pages around current page
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    if (i !== 1 && i !== totalPages) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? "primary" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(i)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm"
                        >
                          {i}
                        </Button>
                      );
                    }
                  }
                  
                  // Add ellipsis before last page if needed
                  if (currentPage < totalPages - 2) {
                    pages.push(
                      <span key="ellipsis2" className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  
                  // Always show last page (if more than 1 page)
                  if (totalPages > 1) {
                    pages.push(
                      <Button
                        key={totalPages}
                        variant={currentPage === totalPages ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm"
                      >
                        {totalPages}
                      </Button>
                    );
                  }
                }
                
                return pages;
              })()}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <span className="sr-only">ถัดไป</span>
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}