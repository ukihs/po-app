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
import { Edit, Trash2, Ellipsis, Search, X, Filter, UserRoundPlus, Copy, KeyRound } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardToolbar } from '../ui/card';
import { DataGrid } from '../ui/data-grid';
import { DataGridColumnHeader } from '../ui/data-grid-column-header';
import { DataGridPagination } from '../ui/data-grid-pagination';
import {
  DataGridTable,
} from '../ui/data-grid-table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

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
  onResetPassword: (user: User) => void;
  onAddUser: () => void;
  isCurrentUser: (user: User) => boolean;
  onShowAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => void;
}

const getRoleBadge = (role?: string) => {
  const userRole = role || 'employee';
  const roleConfig: Record<string, { 
    variant: "primary" | "secondary" | "destructive" | "success" | "warning" | "info";
    appearance: "default" | "light" | "outline" | "ghost";
    name: string 
  }> = {
    admin: { 
      variant: "destructive",
      appearance: "light",
      name: 'ผู้จัดการระบบ' 
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
    employee: { 
      variant: "success",
      appearance: "light",
      name: 'พนักงาน' 
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

function ActionsCell({ row, onEditUser, onDeleteUser, onResetPassword, isCurrentUser, onShowAlert }: { 
  row: Row<User>; 
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onResetPassword: (user: User) => void;
  isCurrentUser: (user: User) => boolean;
  onShowAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => void;
}) {
  const handleCopyId = () => {
    navigator.clipboard.writeText(row.original.uid);
    if (onShowAlert) {
      onShowAlert(`คัดลอกไอดีผู้ใช้แล้ว`, 'success');
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
        <DropdownMenuLabel>จัดการผู้ใช้</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onEditUser(row.original)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>แก้ไขข้อมูล</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onResetPassword(row.original)}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyId}>
            <Copy className="mr-2 h-4 w-4" />
            <span>คัดลอกไอดีผู้ใช้</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {!isCurrentUser(row.original) ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteUser(row.original)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>ลบผู้ใช้</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled className="opacity-50">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>ไม่สามารถลบตัวเองได้</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


const createColumns = (onEditUser: (user: User) => void, onDeleteUser: (user: User) => void, onResetPassword: (user: User) => void, isCurrentUser: (user: User) => boolean, onShowAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => void): ColumnDef<User>[] => [
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
      
      const isCurrent = isCurrentUser(row.original);
      
      return (
        <div className="space-y-px">
          <div className="flex items-center gap-2">
            <div className="font-medium text-foreground">{fullName}</div>
            {isCurrent && (
              <Badge variant="secondary" appearance="outline" size="sm" className="text-xs">
                คุณ
              </Badge>
            )}
          </div>
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
      const role = row.getValue("role") as string;
      
      if (role === 'supervisor' || role === 'procurement' || role === 'admin') {
        return <div className="font-medium text-foreground">-</div>;
      }
      
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
    cell: ({ row }) => <ActionsCell row={row} onEditUser={onEditUser} onDeleteUser={onDeleteUser} onResetPassword={onResetPassword} isCurrentUser={isCurrentUser} onShowAlert={onShowAlert} />,
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
  onResetPassword,
  onAddUser,
  isCurrentUser,
  onShowAlert
}: UsersDataTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'displayName', desc: false }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const columns = useMemo(() => createColumns(onEditUser, onDeleteUser, onResetPassword, isCurrentUser, onShowAlert), [onEditUser, onDeleteUser, onResetPassword, isCurrentUser, onShowAlert]);

  const filteredData = useMemo(() => {
    let filtered = data;
    
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(user => {
        return (
          user.firstName?.toLowerCase().includes(search) ||
          user.lastName?.toLowerCase().includes(search) ||
          user.displayName?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search)
        );
      });
    }
    
    if (selectedRoles?.length) {
      filtered = filtered.filter(user => selectedRoles.includes(user.role || 'employee'));
    }
    
    return filtered;
  }, [searchQuery, selectedRoles, data]);

  const roleCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const role = item.role || 'employee';
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

  // Reset to first page when filters change
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery, selectedRoles]);

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
                            {role === 'admin' ? 'ผู้จัดการระบบ' :
                             role === 'supervisor' ? 'หัวหน้างาน' :
                             role === 'procurement' ? 'ฝ่ายจัดซื้อ' :
                             role === 'employee' ? 'พนักงาน' : role}
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
          />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}