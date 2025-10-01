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
import { Edit, Trash2, Shield, ShoppingCart, UserCheck, Package, Crown, Ellipsis, Search, X, Filter, UserRoundPlus } from 'lucide-react';

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
  onAddUser: () => void;
}

const getRoleBadge = (role?: string) => {
  const userRole = role || 'buyer';
  const roleConfig: Record<string, { 
    variant: "primary" | "secondary" | "destructive" | "success" | "warning" | "info";
    appearance: "default" | "light" | "outline" | "ghost";
    name: string 
  }> = {
    superadmin: { 
      variant: "destructive",
      appearance: "light",
      name: 'ผู้ดูแลระบบ' 
    },
    supervisor: { 
      variant: "warning",
      appearance: "light",
      name: 'หัวหน้างาน' 
    },
    procurement: { 
      variant: "info",
      appearance: "light",
      name: 'ฝ่ายจัดซื้อ' 
    },
    buyer: { 
      variant: "success",
      appearance: "light",
      name: 'ผู้ขอซื้อ' 
    }
  };
  
  const config = roleConfig[userRole] || {
    variant: "secondary",
    appearance: "light",
    name: userRole.charAt(0).toUpperCase() + userRole.slice(1)
  };
  
  return (
    <Badge variant={config.variant} appearance={config.appearance} size="sm">
      {config.name}
    </Badge>
  );
};

function ActionsCell({ row, onEditUser, onDeleteUser }: { 
  row: Row<User>; 
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}) {
  const handleCopyId = () => {
    navigator.clipboard.writeText(row.original.uid);
    toast.success(`User ID คัดลอกแล้ว: ${row.original.uid}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" mode="icon" variant="ghost">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onClick={() => onEditUser(row.original)}>
          <Edit className="mr-2 h-4 w-4" />
          แก้ไขข้อมูล
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyId}>
          คัดลอก User ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDeleteUser(row.original)}>
          <Trash2 className="mr-2 h-4 w-4" />
          ลบผู้ใช้
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


const createColumns = (onEditUser: (user: User) => void, onDeleteUser: (user: User) => void): ColumnDef<User>[] => [
  {
    accessorKey: "uid",
    id: "uid",
    header: () => <DataGridTableRowSelectAll />,
    cell: ({ row }) => <DataGridTableRowSelect row={row} />,
    enableSorting: false,
    size: 35,
    enableResizing: false,
  },
  {
    accessorKey: "displayName",
    id: "displayName",
    header: ({ column }) => <DataGridColumnHeader title="ชื่อผู้ใช้" visibility={true} column={column} />,
    cell: ({ row }) => {
      const firstName = row.original.firstName || '';
      const lastName = row.original.lastName || '';
      const displayName = row.original.displayName || '';
      const email = row.original.email || '';
      
      const fullName = firstName && lastName 
        ? `${firstName} ${lastName}`.trim()
        : displayName || 'ยังไม่กำหนดชื่อ';
      
      return (
        <div className="space-y-px">
          <div className="font-medium text-foreground">{fullName}</div>
          {email && <div className="text-muted-foreground">{email}</div>}
        </div>
      );
    },
    size: 250,
    enableSorting: true,
    enableHiding: false,
    enableResizing: true,
  },
  {
    accessorKey: "role",
    id: "role",
    header: ({ column }) => <DataGridColumnHeader title="บทบาท" visibility={true} column={column} />,
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return getRoleBadge(role);
    },
    size: 120,
    enableSorting: true,
    enableHiding: true,
    enableResizing: true,
  },
  {
    accessorKey: "supervisorName",
    id: "supervisorName",
    header: ({ column }) => <DataGridColumnHeader title="หัวหน้างาน" visibility={true} column={column} />,
    cell: ({ row }) => {
      const supervisorName = row.getValue("supervisorName") as string;
      return (
        <div className="font-medium text-foreground">
          {supervisorName || 'ยังไม่กำหนด'}
        </div>
      );
    },
    size: 150,
    enableSorting: true,
    enableHiding: true,
    enableResizing: true,
  },
  {
    id: "actions",
    header: '',
    cell: ({ row }) => <ActionsCell row={row} onEditUser={onEditUser} onDeleteUser={onDeleteUser} />,
    size: 60,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  },
];

export default function UsersDataTable({ 
  data, 
  loading, 
  onEditUser, 
  onDeleteUser,
  onAddUser
}: UsersDataTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'displayName', desc: false }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const columns = useMemo(() => createColumns(onEditUser, onDeleteUser), [onEditUser, onDeleteUser]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesRole = !selectedRoles?.length || selectedRoles.includes(item.role || 'buyer');

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        Object.values(item)
          .join(' ')
          .toLowerCase()
          .includes(searchLower);

      return matchesRole && matchesSearch;
    });
  }, [searchQuery, selectedRoles, data]);

  const roleCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const role = item.role || 'buyer';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [data]);

  const handleRoleChange = (checked: boolean, value: string) => {
    setSelectedRoles(
      (prev = []) => (checked ? [...prev, value] : prev.filter((v) => v !== value)),
    );
  };

  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map((column) => column.id as string));

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: User) => row.uid,
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
        <span className="ml-3 sm:ml-4 text-sm sm:text-lg">โหลดข้อมูลผู้ใช้งาน...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">ไม่พบข้อมูลผู้ใช้งาน</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          สร้างผู้ใช้คนแรกเพื่อเริ่มต้น
        </p>
        <Button onClick={onAddUser} className="w-full sm:w-auto bg-[#6EC1E4] hover:bg-[#2b9ccc]">
          <UserRoundPlus className="h-4 w-4 mr-2" />
          เพิ่มผู้ใช้
        </Button>
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
                  placeholder="ค้นหาผู้ใช้..."
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
                    <span className="hidden sm:inline">บทบาท</span>
                    <span className="sm:hidden">กรอง</span>
                    {selectedRoles.length > 0 && (
                      <Badge size="sm" appearance="outline">
                        {selectedRoles.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">กรองตามบทบาท</div>
                    <div className="space-y-3">
                      {Object.keys(roleCounts).map((role) => (
                        <div key={role} className="flex items-center gap-2.5">
                          <Checkbox
                            id={role}
                            checked={selectedRoles.includes(role)}
                            onCheckedChange={(checked) => handleRoleChange(checked === true, role)}
                          />
                          <Label
                            htmlFor={role}
                            className="grow flex items-center justify-between font-normal gap-1.5"
                          >
                            {role === 'superadmin' ? 'ผู้ดูแลระบบ' :
                             role === 'supervisor' ? 'หัวหน้างาน' :
                             role === 'procurement' ? 'ฝ่ายจัดซื้อ' :
                             role === 'buyer' ? 'ผู้ขอซื้อ' : role}
                            <span className="text-muted-foreground">{roleCounts[role]}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeading>
          <CardToolbar>
            <Button onClick={onAddUser} className="w-full sm:w-auto bg-[#6EC1E4] hover:bg-[#2b9ccc] text-sm">
              <UserRoundPlus />
              <span className="hidden sm:inline">เพิ่มผู้ใช้</span>
              <span className="sm:hidden">เพิ่ม</span>
            </Button>
          </CardToolbar>
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