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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Edit, Trash2, Shield, ShoppingCart, UserCheck, Package, Crown } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface User {
  uid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  supervisorName?: string;
  supervisorUid?: string;
}

interface UsersDataTableProps {
  data: User[];
  loading: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const getRoleBadge = (role?: string) => {
  const userRole = role || 'buyer';
  const roleConfig: Record<string, { 
    className: string; 
    icon: React.ReactNode; 
    name: string 
  }> = {
    superadmin: { 
      className: 'bg-red-500 hover:bg-red-600 text-white border-red-500', 
      icon: <Crown className="h-3 w-3" />, 
      name: 'ผู้ดูแลระบบ' 
    },
    supervisor: { 
      className: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500', 
      icon: <UserCheck className="h-3 w-3" />, 
      name: 'หัวหน้างาน' 
    },
    procurement: { 
      className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500', 
      icon: <Package className="h-3 w-3" />, 
      name: 'ฝ่ายจัดซื้อ' 
    },
    buyer: { 
      className: 'bg-green-500 hover:bg-green-600 text-white border-green-500', 
      icon: <ShoppingCart className="h-3 w-3" />, 
      name: 'ผู้ขอซื้อ' 
    }
  };
  
  const config = roleConfig[userRole] || {
    className: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500',
    icon: <Shield className="h-3 w-3" />,
    name: userRole.charAt(0).toUpperCase() + userRole.slice(1)
  };
  
  return (
    <Badge className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.name}
    </Badge>
  );
};


const createColumns = (onEditUser: (user: User) => void, onDeleteUser: (user: User) => void): ColumnDef<User>[] => [
  {
    accessorKey: "displayName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          ชื่อผู้ใช้
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const firstName = row.original.firstName || '';
      const lastName = row.original.lastName || '';
      const displayName = row.original.displayName || '';
      
      const fullName = firstName && lastName 
        ? `${firstName} ${lastName}`.trim()
        : displayName || 'ยังไม่กำหนดชื่อ';
      
      return (
        <div className="font-normal">
          {fullName}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          อีเมล
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return (
        <div className="text-sm">
          {email && (
            <div className="flex items-center gap-1">
              {email}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "บทบาท",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return getRoleBadge(role);
    },
  },
  {
    accessorKey: "supervisorName",
    header: "หัวหน้างาน",
    cell: ({ row }) => {
      const supervisorName = row.getValue("supervisorName") as string;
      return (
        <div className="text-sm">
          {supervisorName || 'ยังไม่กำหนด'}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">เปิดเมนู</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.uid)}>
              คัดลอก User ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditUser(user)}>
              <Edit className="mr-2 h-4 w-4" />
              แก้ไขข้อมูล
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteUser(user)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              ลบผู้ใช้
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];

export default function UsersDataTable({ 
  data, 
  loading, 
  onEditUser, 
  onDeleteUser
}: UsersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = createColumns(onEditUser, onDeleteUser);

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
      const firstName = row.original.firstName?.toLowerCase() || '';
      const lastName = row.original.lastName?.toLowerCase() || '';
      const displayName = row.original.displayName?.toLowerCase() || '';
      const email = row.original.email?.toLowerCase() || '';
      
      return (
        firstName.includes(search) ||
        lastName.includes(search) ||
        displayName.includes(search) ||
        email.includes(search)
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
        <span className="ml-4 text-lg">โหลดข้อมูลผู้ใช้งาน...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-12">
        <h3 className="text-xl font-semibold mb-2">ไม่พบข้อมูลผู้ใช้งาน</h3>
        <p className="text-muted-foreground mb-4">
          สร้างผู้ใช้คนแรกเพื่อเริ่มต้น
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล..."
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
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
              ))
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