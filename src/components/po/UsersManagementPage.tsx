import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
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

  const [editUser, setEditUser] = useState({
    email: '',
    displayName: '',
    role: 'buyer'
  });

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

  const createUser = async () => {
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
        showToast('User created successfully', 'success');
        setShowCreateModal(false);
        setNewUser({
          email: '',
          displayName: '',
          password: '',
          role: 'buyer'
        });
        fetchUsers(currentPage, searchTerm, sortOrder);
      } else {
        showToast(data.message || 'Failed to create user', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Error creating user', 'error');
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;

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
        showToast('User updated successfully', 'success');
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
        showToast('User deleted successfully', 'success');
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
    const toast = document.createElement('div');
    toast.className = `alert ${type === 'success' ? 'alert-success' : type === 'error' ? 'alert-error' : 'alert-info'} fixed top-4 right-4 z-50 w-auto max-w-sm`;
    toast.innerHTML = `
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
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
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
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
    const roleConfig: Record<string, { color: string; icon: React.ReactNode; name: string }> = {
      superadmin: { 
        color: 'badge-soft badge-error', 
        icon: <Crown className="h-3 w-3" />, 
        name: 'Super Admin' 
      },
      supervisor: { 
        color: 'badge-soft badge-warning', 
        icon: <UserCheck className="h-3 w-3" />, 
        name: 'Supervisor' 
      },
      procurement: { 
        color: 'badge-soft badge-info', 
        icon: <Package className="h-3 w-3" />, 
        name: 'Procurement' 
      },
      buyer: { 
        color: 'badge-soft badge-success', 
        icon: <ShoppingCart className="h-3 w-3" />, 
        name: 'Buyer' 
      }
    };
    
    const config = roleConfig[userRole] || {
      color: 'badge-soft badge-neutral',
      icon: <Shield className="h-3 w-3" />,
      name: userRole.charAt(0).toUpperCase() + userRole.slice(1)
    };
    
    return (
      <div className={`badge badge-sm ${config.color} gap-1`}>
        {config.icon}
        {config.name}
      </div>
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            การจัดการผู้ใช้งาน
          </h1>
          <p className="text-base-content/70">
            หน้าจัดการผู้ใช้งานในระบบทั้งหมด
          </p>
        </div>

      <div className="card bg-base-100 shadow-sm mb-4">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <label className="input input-bordered flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 opacity-50" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล"
                  className="grow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <kbd className="kbd kbd-sm">Enter</kbd>
                )}
              </label>
            </form>

            <div className="flex gap-2">
              <button
                className="btn btn-outline"
                onClick={() => fetchUsers(currentPage, searchTerm, sortOrder)}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                รีเฟรช
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <UserPlus className="h-4 w-4" />
                เพิ่มผู้ใช้
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="ml-4 text-lg">โหลดข้อมูลผู้ใช้งาน...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-12">
              <h3 className="text-xl font-semibold mb-2">ไม่พบข้อมูลผู้ใช้งาน</h3>
              <p className="text-base-content/70 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first user to get started'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create First User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ชื่อผู้ใช้</th>
                    <th>อีเมล</th>
                    <th>บทบาท</th>
                    <th>
                      <div className="flex items-center gap-2">
                        สร้างเมื่อวันที่
                        <label className="swap swap-rotate cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={sortOrder === 'asc'} 
                            onChange={handleSortToggle}
                          />
                          <ArrowDownAZ className="swap-off h-4 w-4 text-primary" />
                          <ArrowUpAZ className="swap-on h-4 w-4 text-secondary" />
                        </label>
                      </div>
                    </th>
                    <th>ลงชื่อเข้าใช้ล่าสุด</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle h-12 w-12 bg-neutral text-neutral-content">
                              <div className="flex items-center justify-center w-full h-full text-lg font-bold">
                                {(user.displayName || user.email || 'U')[0].toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">
                              {user.displayName || 'No name'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="text-sm">
                          {user.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 opacity-50" />
                              {user.email}
                            </div>
                          )}
                          {user.phoneNumber && (
                            <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
                              <Phone className="h-3 w-3 opacity-50" />
                              {user.phoneNumber}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        {getRoleBadge(user.role)}
                      </td>

                      <td>
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 opacity-50" />
                          {formatDate(user.metadata.creationTime)}
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 opacity-50" />
                          {formatDate(user.metadata.lastSignInTime)}
                        </div>
                      </td>

                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalUsers > pagination.limit && (
            <div className="flex justify-center p-4">
              <div className="join">
                <button
                  className="join-item btn"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    fetchUsers(newPage, searchTerm, sortOrder);
                  }}
                >
                  « Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      className={`join-item btn ${pageNum === currentPage ? 'btn-active' : ''}`}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        fetchUsers(pageNum, searchTerm, sortOrder);
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  className="join-item btn"
                  disabled={!pagination.hasNextPage}
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    fetchUsers(newPage, searchTerm, sortOrder);
                  }}
                >
                  Next »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-fit max-w-sm mx-auto">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-primary" />
              สร้างผู้ใช้ใหม่
            </h3>
            
            <div className="space-y-2 w-auto">
              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">อีเมลของผู้ใช้</legend>
                <input 
                  type="email" 
                  className="input w-full" 
                  placeholder="กรอกอีเมล"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">รหัสผ่าน</legend>
                <input 
                  type="password" 
                  className="input w-full" 
                  placeholder="กรอกรหัสผ่าน"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  minLength={6}
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">ชื่อที่แสดงในระบบ</legend>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="กรอกชื่อที่แสดง"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">บทบาทในระบบ</legend>
                <select
                  className="select w-full"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="buyer">Buyer (ผู้ขอซื้อ)</option>
                  <option value="supervisor">Supervisor (หัวหน้างาน)</option>
                  <option value="procurement">Procurement (ฝ่ายจัดซื้อ)</option>
                  <option value="superadmin">Super Admin (ผู้ดูแลระบบ)</option>
                </select>
              </fieldset>

            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowCreateModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={createUser}>
                สร้างผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-fit max-w-sm mx-auto">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <Edit className="h-5 w-5 text-warning" />
              แก้ไขข้อมูลผู้ใช้
            </h3>
            
            <div className="space-y-2 w-auto">
              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">อีเมลของผู้ใช้</legend>
                <input
                  type="email"
                  className="input w-full"
                  placeholder="กรอกอีเมล"
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">ชื่อที่แสดงในระบบ</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="กรอกชื่อที่แสดง"
                  value={editUser.displayName}
                  onChange={(e) => setEditUser({...editUser, displayName: e.target.value})}
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">บทบาทในระบบ</legend>
                <select
                  className="select w-full"
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                >
                  <option value="buyer">Buyer (ผู้ขอซื้อ)</option>
                  <option value="supervisor">Supervisor (หัวหน้างาน)</option>
                  <option value="procurement">Procurement (ฝ่ายจัดซื้อ)</option>
                  <option value="superadmin">Super Admin (ผู้ดูแลระบบ)</option>
                </select>
              </fieldset>

            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowEditModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-warning" onClick={updateUser}>
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-auto max-w-lg">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <Trash2 className="h-5 w-5 text-error" />
              ยืนยันการลบผู้ใช้
            </h3>
            
            <div className="py-4">
              <p className="text-base">
                คุณต้องการลบผู้ใช้นี้หรือไม่?
              </p>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowDeleteModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-error" onClick={deleteUser}>
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}