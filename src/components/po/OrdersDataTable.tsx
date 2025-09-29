"use client";

import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal, 
  Loader2,
  Search,
  Filter,
  Eye,
  Settings,
  ChevronLeft
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardHeader, CardHeading, CardToolbar, CardTable } from '../ui/card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

type Role = 'buyer' | 'supervisor' | 'procurement' | null;
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
  role: Role;
  expanded: Record<string, boolean>;
  processingKeys: Set<string>;
  drafts: Record<string, Record<number, {category?:string; itemStatus?:string}>>;
  onToggleExpanded: (id: string) => void;
  onSaveOrderStatus: (order: Order, status: OrderStatus) => Promise<void>;
  onSaveItem: (order: Order, idx: number) => Promise<void>;
  onSetDraft: (orderId: string, idx: number, patch: Partial<{category: string; itemStatus: string}>) => void;
  onGetItemValue: (order: Order, idx: number) => {category: string; itemStatus: string};
}

const createColumns = (
  role: Role,
  expanded: Record<string, boolean>,
  processingKeys: Set<string>,
  drafts: Record<string, Record<number, {category?:string; itemStatus?:string}>>,
  onToggleExpanded: (id: string) => void,
  onSaveOrderStatus: (order: Order, status: OrderStatus) => Promise<void>,
  onSaveItem: (order: Order, idx: number) => Promise<void>,
  onSetDraft: (orderId: string, idx: number, patch: Partial<{category: string; itemStatus: string}>) => void,
  onGetItemValue: (order: Order, idx: number) => {category: string; itemStatus: string}
) => [
  {
    accessorKey: "orderNo",
    header: "รายการที่",
    cell: ({ row }: { row: any }) => {
      const order = row.original;
      const isOpen = !!expanded[order.id];
      
      return (
        <Button 
          variant="ghost" 
          size="sm" 
          className="inline-flex items-center gap-1 h-auto p-0 font-medium"
          onClick={() => onToggleExpanded(order.id)}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          #{order.orderNo ?? '-'}
        </Button>
      );
    },
    size: 120,
  },
  {
    accessorKey: "date",
    header: "วันที่",
    cell: ({ row }: { row: any }) => {
      const order = row.original;
      return (
        <div className="text-muted-foreground">
          {order.date || fmtTS(order.createdAt)}
        </div>
      );
    },
    size: 140,
  },
  {
    accessorKey: "requesterName",
    header: "ผู้ขอซื้อ",
    cell: ({ row }: { row: any }) => {
      const requesterName = row.getValue("requesterName") as string;
      const requester = row.original.requester;
      return (
        <div className="font-normal">
          {requesterName || requester || '-'}
        </div>
      );
    },
    size: 180,
  },
  {
    accessorKey: "totalAmount",
    header: "ยอดรวม",
    cell: ({ row }: { row: any }) => {
      const order = row.original;
      const total = (order.totalAmount ?? order.total ?? 0) as number;
      return (
        <div className="tabular-nums">
          {total.toLocaleString('th-TH')} บาท
        </div>
      );
    },
    size: 140,
  },
  {
    accessorKey: "status",
    header: "สถานะ",
    cell: ({ row }: { row: any }) => {
      const status = row.getValue("status") as OrderStatus;
      return getStatusBadge(status);
    },
    size: 140,
  },
  {
    id: "actions",
    header: "การดำเนินการ",
    cell: ({ row }: { row: any }) => {
      const order = row.original;

      if (role === 'procurement') {
        return (
          <div className="flex items-center gap-2">
            <Select
              value={order.status}
              onValueChange={(value) => onSaveOrderStatus(order, value as OrderStatus)}
              disabled={processingKeys.has(order.id)}
            >
              <SelectTrigger className="w-[180px]">
               <SelectValue placeholder="เลือกสถานะ…" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_OPTIONS.map(x=>(
                  <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {processingKeys.has(order.id) && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        );
      }

      return <span className="text-muted-foreground">—</span>;
    },
    size: 200,
  },
];

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
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const columns = useMemo(() => createColumns(
    role,
    expanded,
    processingKeys,
    drafts,
    onToggleExpanded,
    onSaveOrderStatus,
    onSaveItem,
    onSetDraft,
    onGetItemValue
  ), [role, expanded, processingKeys, drafts, onToggleExpanded, onSaveOrderStatus, onSaveItem, onSetDraft, onGetItemValue]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const search = searchTerm.toLowerCase();
    return data.filter(order => 
      order.requesterName?.toLowerCase().includes(search) ||
      order.requester?.toLowerCase().includes(search) ||
      order.id.toLowerCase().includes(search) ||
      order.orderNo?.toString().includes(search)
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      <div className="text-center p-12">
        <h3 className="text-xl font-semibold mb-2">ไม่พบข้อมูลใบสั่งซื้อ</h3>
        <p className="text-muted-foreground mb-4">
          ยังไม่มีใบสั่งซื้อในระบบ
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardHeading>รายการใบขอซื้อ</CardHeading>
        <CardToolbar>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อผู้ขอซื้อหรือหมายเลขใบขอซื้อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  คอลัมน์
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>แสดงคอลัมน์</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.accessorKey || column.id}
                    checked={columnVisibility[column.accessorKey || column.id || ''] !== false}
                    onCheckedChange={(checked) =>
                      setColumnVisibility(prev => ({
                        ...prev,
                        [column.accessorKey || column.id || '']: checked
                      }))
                    }
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardToolbar>
      </CardHeader>
      <CardTable>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">รายการที่</TableHead>
                <TableHead className="w-[140px]">วันที่</TableHead>
                <TableHead className="w-[180px]">ผู้ขอซื้อ</TableHead>
                <TableHead className="w-[140px]">ยอดรวม</TableHead>
                <TableHead className="w-[140px]">สถานะ</TableHead>
                <TableHead className="w-[200px]">การดำเนินการ</TableHead>
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
                          className="inline-flex items-center gap-1 h-auto p-0 font-semibold text-base"
                          onClick={() => onToggleExpanded(order.id)}
                        >
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          #{order.orderNo ?? '-'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">
                          {order.date || fmtTS(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-normal">
                          {order.requesterName || order.requester || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="tabular-nums">
                          {((order.totalAmount ?? order.total ?? 0) as number).toLocaleString('th-TH')} บาท
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        {role === 'procurement' ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => onSaveOrderStatus(order, value as OrderStatus)}
                              disabled={processingKeys.has(order.id)}
                            >
                              <SelectTrigger className="w-[180px]">
                               <SelectValue placeholder="เลือกสถานะ…" />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUS_OPTIONS.map(x=>(
                                  <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {processingKeys.has(order.id) && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-muted/50 p-4">
                            <div className="rounded-md border bg-background overflow-hidden">
                              <div className="px-4 py-3 text-sm font-semibold border-b">รายการสินค้า</div>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>รายละเอียด</TableHead>
                                      <TableHead>จำนวน</TableHead>
                                      <TableHead>ราคาต่อหน่วย(บาท)</TableHead>
                                      <TableHead>รวมทั้งสิ้น(บาท)</TableHead>
                                      <TableHead>ประเภทสินค้า</TableHead>
                                      <TableHead>สถานะรายการ</TableHead>
                                      {role === 'procurement' && (
                                        <TableHead></TableHead>
                                      )}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                  {(order.items||[]).map((it, idx)=>{
                                    const val = onGetItemValue(order, idx);
                                    const options = getItemStatusOptions(val.category);

                                    return (
                                      <TableRow key={idx}>
                                        <TableCell>{it.description || '-'}</TableCell>
                                        <TableCell>{it.quantity ?? '-'}</TableCell>
                                        <TableCell>{it.amount!=null ? Number(it.amount).toLocaleString('th-TH') : '-'}</TableCell>
                                        <TableCell>{it.lineTotal!=null ? Number(it.lineTotal).toLocaleString('th-TH') : '-'}</TableCell>

                                        <TableCell>
                                          {role === 'procurement' ? (
                                            <Select
                                              value={val.category}
                                              onValueChange={(value)=>onSetDraft(order.id, idx, {category: value})}
                                              disabled={processingKeys.has(`${order.id}:${idx}`)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="เลือกประเภท…" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {ITEM_CATEGORIES.map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <Badge variant={val.category ? "info" : "secondary"} appearance="light">
                                              {val.category || 'ยังไม่ระบุ'}
                                            </Badge>
                                          )}
                                        </TableCell>

                                        <TableCell>
                                          {role === 'procurement' ? (
                                            <Select
                                              value={val.itemStatus}
                                              onValueChange={(value)=>onSetDraft(order.id, idx, {itemStatus: value})}
                                              disabled={processingKeys.has(`${order.id}:${idx}`)}
                                            >
                                              <SelectTrigger>
                                               <SelectValue placeholder="เลือกสถานะ…" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {options.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <Badge variant={val.itemStatus ? "secondary" : "secondary"} appearance="light">
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
                                              disabled={processingKeys.has(`${order.id}:${idx}`)}
                                              className="font-normal"
                                            >
                                              {processingKeys.has(`${order.id}:${idx}`) && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
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
        <div className="flex items-center justify-between p-4 border-t">
          {/* Left - Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Center - Item count */}
          <div className="text-sm text-muted-foreground">
            {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
          </div>

          {/* Right - Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">ก่อนหน้า</span>
                <ChevronLeft className="h-4 w-4" />
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
                        className="h-8 w-8 p-0"
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
                      className="h-8 w-8 p-0"
                    >
                      1
                    </Button>
                  );
                  
                  // Add ellipsis after first page if needed
                  if (currentPage > 3) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 text-muted-foreground">
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
                          className="h-8 w-8 p-0"
                        >
                          {i}
                        </Button>
                      );
                    }
                  }
                  
                  // Add ellipsis before last page if needed
                  if (currentPage < totalPages - 2) {
                    pages.push(
                      <span key="ellipsis2" className="px-2 text-muted-foreground">
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
                        className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">ถัดไป</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardTable>
    </Card>
  );
}
