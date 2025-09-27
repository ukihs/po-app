"use client";

import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronRight, MoreHorizontal, Loader2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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
const STATUS_BADGE: Record<OrderStatus,string> = {
  pending:'bg-yellow-100 text-yellow-800',
  approved:'bg-emerald-100 text-emerald-800',
  rejected:'bg-rose-100 text-rose-800',
  in_progress:'bg-sky-100 text-sky-800',
  delivered:'bg-emerald-100 text-emerald-800',
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
): ColumnDef<Order>[] => [
  {
    accessorKey: "orderNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          รายการที่
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
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
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          วันที่
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="text-muted-foreground">
          {order.date || fmtTS(order.createdAt)}
        </div>
      );
    },
  },
  {
    accessorKey: "requesterName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          ผู้ขอซื้อ
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const requesterName = row.getValue("requesterName") as string;
      const requester = row.original.requester;
      return (
        <div className="font-normal">
          {requesterName || requester || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          ยอดรวม
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const order = row.original;
      const total = (order.totalAmount ?? order.total ?? 0) as number;
      return (
        <div className="tabular-nums">
          {total.toLocaleString('th-TH')} บาท
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "สถานะ",
    cell: ({ row }) => {
      const status = row.getValue("status") as OrderStatus;
      return (
        <Badge className={STATUS_BADGE[status]}>
          {STATUS_TH[status]}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "การดำเนินการ",
    enableHiding: false,
    cell: ({ row }) => {
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = createColumns(
    role,
    expanded,
    processingKeys,
    drafts,
    onToggleExpanded,
    onSaveOrderStatus,
    onSaveItem,
    onSetDraft,
    onGetItemValue
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, value) => {
      const search = value.toLowerCase();
      const order = row.original;
      
      return !!(
        order.requesterName?.toLowerCase().includes(search) ||
        order.requester?.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search) ||
        order.orderNo?.toString().includes(search)
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6EC1E4]"></div>
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
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="ค้นหาชื่อผู้ขอซื้อหรือหมายเลขใบขอซื้อ..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              คอลัมน์ <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const order = row.original;
                const isOpen = !!expanded[order.id];
                
                return (
                  <React.Fragment key={order.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="hover"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
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
                                            <Badge variant={val.category ? "secondary" : "outline"}>
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
                                               <SelectValue placeholder="เลือกประเภท…" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {options.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <Badge variant={val.itemStatus ? "default" : "outline"}>
                                              {val.itemStatus || 'รอดำเนินการ'}
                                            </Badge>
                                          )}
                                        </TableCell>

                                        {role === 'procurement' && (
                                          <TableCell>
                                            <Button
                                              className="bg-[#6EC1E4] hover:bg-[#2b9ccc] font-normal"
                                              size="sm"
                                              onClick={()=>onSaveItem(order, idx)}
                                              disabled={processingKeys.has(`${order.id}:${idx}`)}
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
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          แสดง {table.getFilteredRowModel().rows.length} รายการ
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ก่อนหน้า
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </div>
  );
}
