"use client";

import React, { useState, useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
  type Row,
} from "@tanstack/react-table";
import type {
  ColumnDef,
} from "@tanstack/react-table";
import { Ellipsis, Trash2, Eye, FileText, Search, X, Filter, Plus } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardToolbar } from '../ui/card';
import { DataGrid } from '../ui/data-grid';
import { DataGridColumnHeader } from '../ui/data-grid-column-header';
import { DataGridPagination } from '../ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '../ui/data-grid-table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { toast } from 'sonner';

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

interface OrdersDataTableProps {
  data: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}

const getStatusBadge = (status: OrderStatus) => {
  const statusConfig: Record<OrderStatus, { 
    variant: "primary" | "secondary" | "destructive" | "success" | "warning" | "info";
    appearance: "default" | "light" | "outline" | "ghost";
    name: string 
  }> = {
    pending: { 
      variant: "warning",
      appearance: "light",
      name: 'รอการอนุมัติ' 
    },
    approved: { 
      variant: "success",
      appearance: "light",
      name: 'อนุมัติแล้ว' 
    },
    rejected: { 
      variant: "destructive",
      appearance: "light",
      name: 'ปฏิเสธ' 
    },
    in_progress: { 
      variant: "info",
      appearance: "light",
      name: 'กำลังดำเนินการ' 
    },
    delivered: { 
      variant: "secondary",
      appearance: "light",
      name: 'ส่งมอบแล้ว' 
    }
  };
  
  const config = statusConfig[status] || {
    variant: "secondary",
    appearance: "light",
    name: status
  };
  
  return (
    <Badge variant={config.variant} appearance={config.appearance} size="sm">
      {config.name}
    </Badge>
  );
};

const formatDate = (date: any) => {
  if (!date) return '-';
  try {
    if (date.toDate) {
      return date.toDate().toLocaleDateString('th-TH');
    }
    return new Date(date).toLocaleDateString('th-TH');
  } catch {
    return '-';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount || 0);
};

function ActionsCell({ row, onViewOrder, onDeleteOrder }: { 
  row: Row<Order>; 
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}) {
  const handleViewOrder = () => {
    window.open(`/orders/${row.original.id}`, '_blank');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(row.original.id);
    toast.success(`Order ID คัดลอกแล้ว: ${row.original.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" mode="icon" variant="ghost">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onClick={handleViewOrder}>
          <Eye className="mr-2 h-4 w-4" />
          ดูรายละเอียด
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyId}>
          คัดลอก Order ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDeleteOrder(row.original)}>
          <Trash2 className="mr-2 h-4 w-4" />
          ลบใบขอซื้อ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const createColumns = (onViewOrder: (order: Order) => void, onDeleteOrder: (order: Order) => void): ColumnDef<Order>[] => [
  {
    accessorKey: "id",
    id: "id",
    header: () => <DataGridTableRowSelectAll />,
    cell: ({ row }) => <DataGridTableRowSelect row={row} />,
    enableSorting: false,
    size: 35,
    enableResizing: false,
  },
  {
    accessorKey: "orderNo",
    id: "orderNo",
    header: ({ column }) => <DataGridColumnHeader title="เลขที่ใบขอซื้อ" visibility={true} column={column} />,
    cell: ({ row }) => {
      const orderNo = row.getValue("orderNo") as number;
      const id = row.original.id;
      return (
        <div className="space-y-px">
          <div className="font-medium text-foreground">
            #{orderNo || id.slice(-8)}
          </div>
        </div>
      );
    },
    size: 150,
    enableSorting: true,
    enableHiding: false,
    enableResizing: true,
  },
  {
    accessorKey: "requesterName",
    id: "requesterName",
    header: ({ column }) => <DataGridColumnHeader title="ผู้ขอซื้อ" visibility={true} column={column} />,
    cell: ({ row }) => {
      const requesterName = row.getValue("requesterName") as string;
      const requester = row.original.requester;
      return (
        <div className="font-medium text-foreground">
          {requesterName || requester || '-'}
        </div>
      );
    },
    size: 200,
    enableSorting: true,
    enableHiding: true,
    enableResizing: true,
  },
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: ({ column }) => <DataGridColumnHeader title="วันที่สร้าง" visibility={true} column={column} />,
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt");
      return (
        <div className="font-medium text-foreground">
          {formatDate(createdAt)}
        </div>
      );
    },
    size: 120,
    enableSorting: true,
    enableHiding: true,
    enableResizing: true,
  },
  {
    accessorKey: "totalAmount",
    id: "totalAmount",
    header: ({ column }) => <DataGridColumnHeader title="ยอดรวม" visibility={true} column={column} />,
    cell: ({ row }) => {
      const totalAmount = row.getValue("totalAmount") as number;
      const total = row.original.total;
      const amount = totalAmount || total || 0;
      return (
        <div className="font-medium text-foreground">
          {formatCurrency(amount)}
        </div>
      );
    },
    size: 120,
    enableSorting: true,
    enableHiding: true,
    enableResizing: true,
  },
  {
    accessorKey: "status",
    id: "status",
    header: ({ column }) => <DataGridColumnHeader title="สถานะ" visibility={true} column={column} />,
    cell: ({ row }) => {
      const status = row.getValue("status") as OrderStatus;
      return getStatusBadge(status);
    },
    size: 120,
    enableSorting: true,
    enableHiding: true,
    enableResizing: true,
  },
  {
    id: "actions",
    header: '',
    cell: ({ row }) => <ActionsCell row={row} onViewOrder={onViewOrder} onDeleteOrder={onDeleteOrder} />,
    size: 60,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  },
];

export default function OrdersDataTable({ 
  data, 
  loading, 
  onViewOrder, 
  onDeleteOrder
}: OrdersDataTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const columns = useMemo(() => createColumns(onViewOrder, onDeleteOrder), [onViewOrder, onDeleteOrder]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesStatus = !selectedStatuses?.length || selectedStatuses.includes(item.status);

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.requesterName || '').toLowerCase().includes(searchLower) ||
        (item.requester || '').toLowerCase().includes(searchLower) ||
        (item.orderNo?.toString() || '').includes(searchQuery) ||
        item.id.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, selectedStatuses, data]);

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

  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map((column) => column.id as string));

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: Order) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-full sm:w-64 text-sm"
                />
                {searchQuery.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
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
                            {status === 'pending' ? 'รอการอนุมัติ' :
                             status === 'approved' ? 'อนุมัติแล้ว' :
                             status === 'rejected' ? 'ปฏิเสธ' :
                             status === 'in_progress' ? 'กำลังดำเนินการ' :
                             status === 'delivered' ? 'ส่งมอบแล้ว' : status}
                            <span className="text-muted-foreground">{statusCounts[status]}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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