"use client";

import React, { useMemo, useState } from 'react';
import { 
  Eye, 
  Trash2, 
  Loader2,
  Search,
  Filter,
  X,
  Ellipsis,
  Copy
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { DataGrid } from '../ui/data-grid';
import { DataGridTable } from '../ui/data-grid-table';
import { DataGridPagination } from '../ui/data-grid-pagination';
import { DataGridColumnHeader } from '../ui/data-grid-column-header';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Card, CardFooter, CardHeader, CardHeading, CardTable } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Row,
} from '@tanstack/react-table';

import type { Order, OrderStatus } from '../../types';
import { getDisplayOrderNumber } from '../../lib/order-utils';
import type { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { DatePickerPresets } from '../ui/date-picker-presets';

const STATUS_TH: Record<OrderStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  in_progress: 'กำลังดำเนินการ',
  delivered: 'ได้รับแล้ว'
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

const fmtTS = (ts: any) =>
  ts?.toDate
    ? ts.toDate().toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—';

function ActionsCell({ row, onViewOrder, onDeleteOrder, onShowAlert }: { 
  row: Row<Order>; 
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onShowAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => void;
}) {
  const handleCopyOrderNumber = () => {
    const orderNumber = getDisplayOrderNumber(row.original);
    navigator.clipboard.writeText(orderNumber);
    if (onShowAlert) {
      onShowAlert('คัดลอกเลขที่ใบขอซื้อ', 'success', `"${orderNumber}" สำเร็จ!`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" mode="icon" variant="ghost">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-64">
        <DropdownMenuLabel>จัดการใบขอซื้อ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onViewOrder(row.original)}>
            <Eye className="mr-2 h-4 w-4" />
            <span>ดูรายละเอียด</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyOrderNumber}>
            <Copy className="mr-2 h-4 w-4" />
            <span>คัดลอกเลขที่ใบขอซื้อ</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDeleteOrder(row.original)}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>ลบใบขอซื้อ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface OrdersManagementDataTableProps {
  data: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onShowAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => void;
}

export default function OrdersManagementDataTable({ 
  data, 
  loading, 
  onViewOrder,
  onDeleteOrder,
  onShowAlert
}: OrdersManagementDataTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const filteredData = useMemo(() => {
    let filtered = data;
    
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
    
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
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
    
    if (selectedStatuses?.length) {
      filtered = filtered.filter(order => selectedStatuses.includes(order.status));
    }
    
    return filtered;
  }, [data, globalFilter, selectedStatuses, customDateRange]);

  const statusCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const status = item.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [data]);

  const handleStatusChange = (checked: boolean, value: string) => {
    setSelectedStatuses(
      (prev = []) => (checked ? [...prev, value] : prev.filter((v) => v !== value)),
    );
  };

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'orderNo',
        id: 'orderNo',
        header: ({ column }) => <DataGridColumnHeader title="เลขที่ใบขอซื้อ" column={column} />,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="font-medium">
              {getDisplayOrderNumber(order)}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'date',
        id: 'date',
        header: ({ column }) => <DataGridColumnHeader title="วันที่" column={column} />,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="text-muted-foreground text-sm">
              {order.date || fmtTS(order.createdAt)}
            </div>
          );
        },
        size: 140,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'requesterName',
        id: 'requesterName',
        header: ({ column }) => <DataGridColumnHeader title="ผู้ขอซื้อ" column={column} />,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="font-normal text-sm">
              {order.requesterName || order.requester || '-'}
            </div>
          );
        },
        size: 180,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'totalAmount',
        id: 'totalAmount',
        header: ({ column }) => <DataGridColumnHeader title="ยอดรวม" column={column} />,
        cell: ({ row }) => {
          const order = row.original;
          const total = order.totalAmount || order.total || 0;
          return (
            <div className="tabular-nums text-sm">
              {total.toLocaleString('th-TH')} บาท
            </div>
          );
        },
        size: 140,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="สถานะ" column={column} />,
        cell: ({ row }) => {
          const status = row.getValue('status') as OrderStatus;
          return (
            <div className="text-sm">
              {getStatusBadge(status)}
            </div>
          );
        },
        size: 140,
        enableSorting: true,
        enableHiding: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <ActionsCell row={row} onViewOrder={onViewOrder} onDeleteOrder={onDeleteOrder} onShowAlert={onShowAlert} />,
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [onViewOrder, onDeleteOrder]
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, selectedStatuses, customDateRange]);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: Order) => row.id,
    state: {
      pagination,
      sorting,
    },
    columnResizeMode: 'onChange',
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 sm:p-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#6EC1E4]"></div>
        <span className="ml-3 sm:ml-4 text-sm sm:text-lg">โหลดข้อมูลใบขอซื้อ...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">ไม่พบข้อมูลใบขอซื้อ</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          ยังไม่มีใบขอซื้อในระบบ
        </p>
      </div>
    );
  }

  return (
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
      tableLayout={{
        columnsPinnable: true,
        columnsResizable: true,
        columnsMovable: true,
        columnsVisibility: true,
      }}
    >
      <Card>
        <CardHeader className="py-3 sm:py-4">
          <CardHeading>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="size-3.5 sm:size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="ค้นหาใบขอซื้อ..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="ps-9 w-full sm:w-64 text-sm"
                />
                {globalFilter.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setGlobalFilter('')}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto text-sm">
                    <Filter />
                    <span className="hidden sm:inline">สถานะ</span>
                    <span className="sm:hidden">กรอง</span>
                    {selectedStatuses.length > 0 && (
                      <Badge size="sm" appearance="outline">
                        {selectedStatuses.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">กรองตามสถานะ</div>
                    <div className="space-y-3">
                      {Object.keys(statusCounts).map((status) => (
                        <div key={status} className="flex items-center gap-2.5">
                          <Checkbox
                            id={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) => handleStatusChange(checked === true, status)}
                          />
                          <Label
                            htmlFor={status}
                            className="grow flex items-center justify-between font-normal gap-1.5"
                          >
                            {STATUS_TH[status as OrderStatus] || status}
                            <span className="text-muted-foreground">{statusCounts[status]}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <DatePickerPresets
                date={customDateRange}
                onDateChange={(date) => setCustomDateRange(date)}
                placeholder="ช่วงวันที่"
                className="w-full sm:w-auto"
                numberOfMonths={2}
              />
            </div>
          </CardHeading>
        </CardHeader>
        <CardTable>
          <ScrollArea className="h-[400px] sm:h-[500px] md:h-[600px]">
            <div className="min-w-[800px]">
              <DataGridTable />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination 
            sizes={[5, 10, 20, 50]}
            rowsPerPageLabel="Rows per page"
            info="{from} - {to} of {count}"
          />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}