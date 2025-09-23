import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Mail, 
  Calendar,
  Clock,
  Shield,
  ShoppingCart,
  Users,
  UserCheck,
  Package,
  Crown,
  ArrowDownAZ,
  ArrowUpAZ,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';

interface User {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  disabled: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  customClaims?: Record<string, any>;
  role?: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    limit: number;
    totalUsers: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
  };
  search: string | null;
  debug?: {
    totalFromFirebase: number;
    afterFiltering: number;
    paginatedCount: number;
    searchApplied: boolean;
    pagesScanned: number;
  };
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<UsersResponse['pagination'] | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'buyer'
  });

  const [validationErrors, setValidationErrors] = useState({
    email: false,
    displayName: false,
    password: false,
    role: false
  });

  const [formValid, setFormValid] = useState(false);

  const [editUser, setEditUser] = useState({
    email: '',
    displayName: '',
    role: 'buyer'
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    email: false,
    displayName: false,
    role: false
  });

  const [editFormValid, setEditFormValid] = useState(false);

  const fetchUsers = async (page = 1, search = '', sort = sortOrder) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort: sort,
        ...(search && { search })
      });

      const response = await fetch(`/api/users?${params}`);
      const data: UsersResponse = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch users:', data);
        showToast('Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.trim().length > 0;
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateDisplayName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateRole = (role: string): boolean => {
    return ['buyer', 'supervisor', 'procurement', 'superadmin'].includes(role);
  };

  const validateForm = () => {
    const errors = {
      email: !validateEmail(newUser.email),
      displayName: !validateDisplayName(newUser.displayName),
      password: !validatePassword(newUser.password),
      role: !validateRole(newUser.role)
    };

    setValidationErrors(errors);
    
    const isValid = !Object.values(errors).some(error => error);
    setFormValid(isValid);
    
    return isValid;
  };

  const createUser = async () => {
    if (!validateForm()) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');
      return;
    }

    try {
      const userData = {
        ...newUser,
        role: newUser.role
      };
      
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        showToast('สร้างผู้ใช้สำเร็จ', 'success');
        setShowCreateModal(false);
        setNewUser({
          email: '',
          displayName: '',
          password: '',
          role: 'buyer'
        });
        setValidationErrors({
          email: false,
          displayName: false,
          password: false,
          role: false
        });
        setFormValid(false);
        fetchUsers(currentPage, searchTerm, sortOrder);
      } else {
        showToast(data.message || 'Failed to create user', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Error creating user', 'error');
    }
  };

  const validateEditForm = () => {
    const errors = {
      email: !validateEmail(editUser.email),
      displayName: !validateDisplayName(editUser.displayName),
      role: !validateRole(editUser.role)
    };

    setEditValidationErrors(errors);
    
    const isValid = !Object.values(errors).some(error => error);
    setEditFormValid(isValid);
    
    return isValid;
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    if (!validateEditForm()) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');
      return;
    }

    try {
      const userData = {
        email: editUser.email,
        displayName: editUser.displayName,
        role: editUser.role
      };
      
      const response = await fetch(`/api/users/${selectedUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        showToast('อัปเดตผู้ใช้สำเร็จ', 'success');
        setShowEditModal(false);
        fetchUsers(currentPage, searchTerm, sortOrder);
      } else {
        showToast(data.message || 'Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Error updating user', 'error');
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.uid}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        showToast('ลบผู้ใช้สำเร็จ', 'success');
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers(currentPage, searchTerm, sortOrder);
      } else {
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Error deleting user', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast.info(message);
        break;
      default:
        toast(message);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm, sortOrder);
  };

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    fetchUsers(1, searchTerm, newSortOrder);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      email: user.email || '',
      displayName: user.displayName || '',
      role: user.role || 'buyer'
    });
    setEditValidationErrors({
      email: false,
      displayName: false,
      role: false
    });
    setEditFormValid(false);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'ยังไม่มีการลงชื่อเข้าใช้งาน';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    validateForm();
  }, [newUser]);

  useEffect(() => {
    validateEditForm();
  }, [editUser]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-[#2b9ccc]" />
          การจัดการผู้ใช้งาน
        </h1>
        <p className="text-muted-foreground">
          หน้าจัดการผู้ใช้งานในระบบทั้งหมด
        </p>
      </div>

      <Toaster />

      <Card>
        <CardHeader className="pb-2 px-6">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล"
                  className="pl-10 w-full lg:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-muted px-1.5 py-0.5 text-xs rounded">Enter</kbd>
                )}
              </div>
            </form>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(currentPage, searchTerm, sortOrder)}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                รีเฟรช
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="bg-[#6EC1E4] hover:bg-[#2b9ccc]"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                เพิ่มผู้ใช้
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-4 text-lg">โหลดข้อมูลผู้ใช้งาน...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-12">
              <h3 className="text-xl font-semibold mb-2">ไม่พบข้อมูลผู้ใช้งาน</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'ลองปรับเงื่อนไขการค้นหา' : 'สร้างผู้ใช้คนแรกเพื่อเริ่มต้น'}
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
              >
                สร้างผู้ใช้คนแรก
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อผู้ใช้</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        สร้างเมื่อวันที่
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSortToggle}
                          className="h-6 w-6 p-0"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUpAZ className="h-4 w-4" />
                          ) : (
                            <ArrowDownAZ className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>ลงชื่อเข้าใช้ล่าสุด</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid} className="hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg font-normal">
                              {(user.displayName || user.email || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-normal">
                              {user.displayName || 'ยังไม่กำหนดชื่อ'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {user.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.metadata.creationTime)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.metadata.lastSignInTime)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination && pagination.totalUsers > pagination.limit && (
            <div className="flex justify-center p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => {
                        if (pagination.hasPreviousPage) {
                          const newPage = currentPage - 1;
                          setCurrentPage(newPage);
                          fetchUsers(newPage, searchTerm, sortOrder);
                        }
                      }}
                      className={!pagination.hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          onClick={() => {
                            setCurrentPage(pageNum);
                            fetchUsers(pageNum, searchTerm, sortOrder);
                          }}
                          isActive={pageNum === currentPage}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => {
                        if (pagination.hasNextPage) {
                          const newPage = currentPage + 1;
                          setCurrentPage(newPage);
                          fetchUsers(newPage, searchTerm, sortOrder);
                        }
                      }}
                      className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              เพิ่มผู้ใช้
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูลผู้ใช้ใหม่ในระบบ
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                อีเมล <span className="text-destructive">*</span>
              </label>
              <Input 
                id="email"
                type="email" 
                className={validationErrors.email ? 'border-destructive' : ''}
                placeholder="กรอกอีเมล"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive">กรุณากรอกอีเมลที่ถูกต้อง</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                รหัสผ่าน <span className="text-destructive">*</span>
              </label>
              <Input 
                id="password"
                type="password" 
                className={validationErrors.password ? 'border-destructive' : ''}
                placeholder="กรอกรหัสผ่าน"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                minLength={6}
                required
              />
              {validationErrors.password && (
                <p className="text-xs text-destructive">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                ชื่อที่แสดง <span className="text-destructive">*</span>
              </label>
              <Input 
                id="displayName"
                type="text" 
                className={validationErrors.displayName ? 'border-destructive' : ''}
                placeholder="กรอกชื่อที่แสดง"
                value={newUser.displayName}
                onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                minLength={2}
                required
              />
              {validationErrors.displayName && (
                <p className="text-xs text-destructive">ชื่อต้องมีอย่างน้อย 2 ตัวอักษร</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                บทบาท <span className="text-destructive">*</span>
              </label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({...newUser, role: value})}
              >
                <SelectTrigger className={validationErrors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">ผู้ขอซื้อ</SelectItem>
                  <SelectItem value="supervisor">หัวหน้างาน</SelectItem>
                  <SelectItem value="procurement">ฝ่ายจัดซื้อ</SelectItem>
                  <SelectItem value="superadmin">ผู้ดูแลระบบ</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.role && (
                <p className="text-xs text-destructive">กรุณาเลือกบทบาท</p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    email: '',
                    displayName: '',
                    password: '',
                    role: 'buyer'
                  });
                  setValidationErrors({
                    email: false,
                    displayName: false,
                    password: false,
                    role: false
                  });
                  setFormValid(false);
                }}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                className="bg-[#6EC1E4] hover:bg-[#2b9ccc]"
                onClick={createUser}
                disabled={!formValid}
              >
                เพิ่มผู้ใช้
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              แก้ไขข้อมูลผู้ใช้
            </DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลผู้ใช้ในระบบ
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="edit-email" className="text-sm font-medium">
                อีเมลของผู้ใช้ <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-email"
                type="email"
                className={editValidationErrors.email ? 'border-destructive' : ''}
                placeholder="กรอกอีเมล"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              />
              {editValidationErrors.email && (
                <p className="text-xs text-destructive">กรุณากรอกอีเมลที่ถูกต้อง</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-displayName" className="text-sm font-medium">
                ชื่อที่แสดง <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-displayName"
                type="text"
                className={editValidationErrors.displayName ? 'border-destructive' : ''}
                placeholder="กรอกชื่อที่แสดง"
                value={editUser.displayName}
                onChange={(e) => setEditUser({...editUser, displayName: e.target.value})}
                minLength={2}
                required
              />
              {editValidationErrors.displayName && (
                <p className="text-xs text-destructive">ชื่อต้องมีอย่างน้อย 2 ตัวอักษร</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-role" className="text-sm font-medium">
                บทบาท <span className="text-destructive">*</span>
              </label>
              <Select
                value={editUser.role}
                onValueChange={(value) => setEditUser({...editUser, role: value})}
              >
                <SelectTrigger className={editValidationErrors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">ผู้ขอซื้อ</SelectItem>
                  <SelectItem value="supervisor">หัวหน้างาน</SelectItem>
                  <SelectItem value="procurement">ฝ่ายจัดซื้อ</SelectItem>
                  <SelectItem value="superadmin">ผู้ดูแลระบบ</SelectItem>
                </SelectContent>
              </Select>
              {editValidationErrors.role && (
                <p className="text-xs text-destructive">กรุณาเลือกบทบาท</p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                onClick={updateUser}
                disabled={!editFormValid}
              >
                {editFormValid ? 'บันทึก' : 'กรุณากรอกข้อมูลให้ครบถ้วน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              ยืนยันการลบผู้ใช้
            </DialogTitle>
            <DialogDescription>
              คุณต้องการลบผู้ใช้นี้หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              ผู้ใช้: {selectedUser?.displayName || selectedUser?.email}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={deleteUser}>
              ลบผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}