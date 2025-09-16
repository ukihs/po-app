import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  orderBy, 
  query, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { subscribeAuthAndRole } from '../../lib/auth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  Search,  
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Users,
  Shield,
  Mail,
  Calendar,
  RefreshCw,
} from 'lucide-react';

type Role = 'buyer' | 'supervisor' | 'procurement' | 'superadmin';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: any;
  updatedAt: any;
}

interface UserFormData {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

export default function UsersManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    displayName: '',
    role: 'buyer'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthAndRole((user, role) => {
      setUser(user);
      setUserRole(role);
      
      if (user && role !== 'superadmin') {
        window.location.href = '/';
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (userRole !== 'superadmin') return;

    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'buyer',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      setUsers(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, [userRole]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      role: 'buyer'
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      displayName: user.displayName,
      role: user.role
    });
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingUser) {
        const userRef = doc(db, 'users', editingUser.uid);
        await updateDoc(userRef, {
          displayName: formData.displayName,
          role: formData.role,
          updatedAt: serverTimestamp()
        });
      } else {
        const { user: newUser } = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        await updateProfile(newUser, { displayName: formData.displayName });
        
        const userRef = doc(db, 'users', newUser.uid);
        await updateDoc(userRef, {
          displayName: formData.displayName,
          role: formData.role,
          updatedAt: serverTimestamp()
        });
      }
      
      setShowModal(false);
      setFormData({ email: '', password: '', displayName: '', role: 'buyer' });
    } catch (error) {
      console.error('Error saving user:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: Role) => {
    const roleConfig = {
      buyer: { label: 'ผู้ซื้อ', className: 'badge-primary' },
      supervisor: { label: 'หัวหน้า', className: 'badge-secondary' },
      procurement: { label: 'จัดซื้อ', className: 'badge-accent' },
      superadmin: { label: 'ผู้ดูแลระบบ', className: 'badge-warning' }
    };
    
    const config = roleConfig[role];
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  if (userRole !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-500">คุณต้องมีสิทธิ์ superadmin เพื่อเข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="input input-bordered flex items-center gap-2">
                <Search className="w-4 h-4 opacity-50" />
                <input
                  type="search"
                  placeholder="ค้นหาด้วยอีเมล"
                  className="grow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </div>

            <div className="flex gap-3">
              <select
                className="select select-bordered"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
              >
                <option value="all">ทุก Role</option>
                <option value="buyer">ผู้ซื้อ</option>
                <option value="supervisor">หัวหน้า</option>
                <option value="procurement">จัดซื้อ</option>
                <option value="superadmin">ผู้ดูแลระบบ</option>
              </select>

              <button
                onClick={handleAddUser}
                className="btn btn-primary gap-2"
              >
                <UserPlus className="w-4 h-4" />
                เพิ่มผู้ใช้
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-4" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>อีเมล</th>
                      <th>Role</th>
                      <th>สร้างเมื่อ</th>
                      <th>อัปเดตล่าสุด</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user) => (
                      <tr key={user.uid}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {user.email}
                          </div>
                        </td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(user.updatedAt)}
                          </div>
                        </td>
                        <td>
                          <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                              <MoreVertical className="w-4 h-4" />
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                              <li>
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  แก้ไข
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="flex items-center gap-2 text-error"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  ลบ
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center p-4">
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      «
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`join-item btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <dialog id="user_modal" className={`modal ${showModal ? 'modal-open' : ''}`}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              {editingUser ? (
                <Edit className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">อีเมล</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="example@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!editingUser}
                  required
                />
              </div>

              {!editingUser && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">รหัสผ่าน</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    placeholder="รหัสผ่าน"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">บทบาท (Role)</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                  required
                >
                  <option value="buyer">ผู้ซื้อ - สร้างและติดตามใบสั่งซื้อ</option>
                  <option value="supervisor">หัวหน้างาน - อนุมัติใบสั่งซื้อ</option>
                  <option value="procurement">ฝ่ายจัดซื้อ - ดำเนินการจัดซื้อ</option>
                  <option value="superadmin">ผู้ดูแลระบบ - จัดการผู้ใช้และระบบ</option>
                </select>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      {editingUser ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {editingUser ? 'อัปเดต' : 'เพิ่มผู้ใช้'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowModal(false)}>close</button>
          </form>
        </dialog>

        <dialog id="delete_modal" className={`modal ${showDeleteModal ? 'modal-open' : ''}`}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-error" />
              ยืนยันการลบผู้ใช้
            </h3>
            <p className="text-sm text-gray-500 mb-4">คุณต้องการลบผู้ใช้นี้หรือไม่: {userToDelete?.email}?</p>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cancelDelete}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-error gap-2"
                onClick={confirmDeleteUser}
              >
                ตกลง
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={cancelDelete}>close</button>
          </form>
        </dialog>
      </div>
    </div>
  );
}