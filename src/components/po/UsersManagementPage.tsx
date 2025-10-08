import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users,
  Edit,
  Trash2,
  Check,
  ChevronsUpDown,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiSpam3Fill, 
  RiInformationFill 
} from '@remixicon/react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '../ui/alert';
import UsersDataTable from './UsersDataTable';
import { cn } from '../../lib/utils';
import { useUser } from '../../stores';

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


export default function UsersManagementPage() {
  const currentUser = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'buyer',
    supervisorName: '',
    supervisorUid: '',
    department: ''
  });

  const [validationErrors, setValidationErrors] = useState({
    email: false,
    firstName: false,
    lastName: false,
    password: false,
    role: false,
    supervisorName: false,
    department: false
  });

  const [formValid, setFormValid] = useState(false);

  const [editUser, setEditUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'buyer',
    supervisorName: '',
    supervisorUid: ''
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    email: false,
    firstName: false,
    lastName: false,
    role: false
  });

  const [editFormValid, setEditFormValid] = useState(false);

  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [supervisorOpen, setSupervisorOpen] = useState(false);
  const [supervisorValue, setSupervisorValue] = useState('');
  
  const [editSupervisorOpen, setEditSupervisorOpen] = useState(false);
  const [editSupervisorValue, setEditSupervisorValue] = useState('');

  // Helper function to check if user is current user
  const isCurrentUser = (user: User) => {
    return currentUser?.uid === user.uid;
  };

  // Alert state management
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    description: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sort: 'desc'
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        const supervisorList = data.users.filter((user: User) => 
          user.role === 'supervisor'
        );
        setSupervisors(supervisorList);
      } else {
        showAlert('ไม่สามารถโหลดข้อมูลผู้ใช้', 'error', 'กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      showAlert('เกิดข้อผิดพลาด', 'error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
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

  const validateFirstName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateLastName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateRole = (role: string): boolean => {
    return ['buyer', 'supervisor', 'procurement', 'superadmin'].includes(role);
  };

  const validateForm = () => {
    const errors = {
      email: !validateEmail(newUser.email),
      firstName: !validateFirstName(newUser.firstName),
      lastName: !validateLastName(newUser.lastName),
      password: !validatePassword(newUser.password),
      role: !validateRole(newUser.role),
      supervisorName: false,
      department: false
    };

    setValidationErrors(errors);
    
    const isValid = !Object.values(errors).some(error => error);
    setFormValid(isValid);
    
    return isValid;
  };

  const createUser = async () => {
    if (!validateForm()) {
      showAlert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');
      return;
    }

    try {
      const userData = {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        displayName: `${newUser.firstName} ${newUser.lastName}`.trim(),
        password: newUser.password,
        role: newUser.role,
        supervisorName: newUser.supervisorName || '',
        supervisorUid: newUser.supervisorUid || '',
        department: newUser.department || ''
      };
      
      console.log('Creating user with data:', { ...userData, password: '***' });
      
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      console.log('API Response:', { status: response.status, data });

      if (response.ok) {
        const userName = `${newUser.firstName} ${newUser.lastName}`.trim();
        
        const newUserData: User = {
          uid: data.user.uid,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          displayName: userName,
          role: newUser.role,
          supervisorName: newUser.supervisorName || undefined,
          supervisorUid: newUser.supervisorUid || undefined,
        };
        
        setUsers(prevUsers => [newUserData, ...prevUsers]);
        
        if (newUser.role === 'supervisor') {
          setSupervisors(prevSupervisors => [newUserData, ...prevSupervisors]);
        }
        
        setShowCreateModal(false);
        setNewUser({
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          role: 'buyer',
          supervisorName: '',
          supervisorUid: '',
          department: ''
        });
        setValidationErrors({
          email: false,
          firstName: false,
          lastName: false,
          password: false,
          role: false,
          supervisorName: false,
          department: false
        });
        setFormValid(false);
        setSupervisorValue('');
        
        showAlert(`เพิ่มผู้ใช้ "${userName}" สำเร็จแล้ว`, 'success');
      } else {
        console.error('Failed to create user:', data);
        showAlert('ไม่สามารถเพิ่มผู้ใช้ได้', 'error', data.message || 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showAlert('เกิดข้อผิดพลาด', 'error', 'ไม่สามารถเพิ่มผู้ใช้ได้');
    }
  };

  const validateEditForm = () => {
    const errors = {
      email: !validateEmail(editUser.email),
      firstName: !validateFirstName(editUser.firstName),
      lastName: !validateLastName(editUser.lastName),
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
      showAlert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');
      return;
    }

    try {
      const userData = {
        email: editUser.email,
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        displayName: `${editUser.firstName} ${editUser.lastName}`.trim(),
        role: editUser.role,
        supervisorName: editUser.supervisorName || null,
        supervisorUid: editUser.supervisorUid || null
      };
      
      const response = await fetch(`/api/users/${selectedUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        const userName = `${editUser.firstName} ${editUser.lastName}`.trim();
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.uid === selectedUser!.uid
              ? {
                  ...user,
                  email: editUser.email,
                  firstName: editUser.firstName,
                  lastName: editUser.lastName,
                  displayName: userName,
                  role: editUser.role,
                  supervisorName: editUser.supervisorName || undefined,
                  supervisorUid: editUser.supervisorUid || undefined,
                }
              : user
          )
        );
        
        if (editUser.role === 'supervisor') {
          setSupervisors(prevSupervisors => {
            const exists = prevSupervisors.some(s => s.uid === selectedUser!.uid);
            if (exists) {
              return prevSupervisors.map(s => 
                s.uid === selectedUser!.uid 
                  ? { ...s, displayName: userName, email: editUser.email }
                  : s
              );
            } else {
              return [{
                uid: selectedUser!.uid,
                email: editUser.email,
                displayName: userName,
                role: 'supervisor'
              }, ...prevSupervisors];
            }
          });
        } else {
          setSupervisors(prevSupervisors => 
            prevSupervisors.filter(s => s.uid !== selectedUser!.uid)
          );
        }
        
        setShowEditModal(false);
        
        showAlert(`อัปเดตข้อมูลผู้ใช้ "${userName}" สำเร็จ`, 'success');
      } else {
        showAlert('ไม่สามารถอัปเดตข้อมูลของผู้ใช้ได้', 'error', data.message || 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
      }
    } catch (error) {
      showAlert('เกิดข้อผิดพลาด', 'error', 'ไม่สามารถอัปเดตข้อมูลของผู้ใช้ได้');
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    if (isCurrentUser(selectedUser)) {
      showAlert('ไม่สามารถลบบัญชีของตัวเองได้', 'error', 'กรุณาติดต่อผู้ดูแลระบบคนอื่นเพื่อลบบัญชีของคุณ');
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.uid}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        const userName = selectedUser.displayName || selectedUser.email;
        
        setUsers(prevUsers => prevUsers.filter(user => user.uid !== selectedUser.uid));
        
        setSupervisors(prevSupervisors => 
          prevSupervisors.filter(s => s.uid !== selectedUser.uid)
        );
        
        setShowDeleteModal(false);
        setSelectedUser(null);
        
        showAlert(`ลบบัญชีผู้ใช้ "${userName}" สำเร็จ`, 'success');
      } else {
        showAlert('ไม่สามารถลบบัญชีของผู้ใช้ได้', 'error', data.message || 'กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      showAlert('เกิดข้อผิดพลาด', 'error', 'ไม่สามารถลบบัญชีของผู้ใช้ได้');
    }
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', description?: string) => {
    setAlertState({
      show: true,
      type,
      title: message,
      description
    });

    const duration = type === 'error' ? 5000 : 4000;
    setTimeout(() => {
      setAlertState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          variant: 'success' as const,
          appearance: 'light' as const,
          IconComponent: RiCheckboxCircleFill
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          appearance: 'light' as const,
          IconComponent: RiErrorWarningFill
        };
      case 'warning':
        return {
          variant: 'warning' as const,
          appearance: 'light' as const,
          IconComponent: RiSpam3Fill
        };
      case 'info':
      default:
        return {
          variant: 'info' as const,
          appearance: 'light' as const,
          IconComponent: RiInformationFill
        };
    }
  };


  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    
    const nameParts = (user.displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setEditUser({
      email: user.email || '',
      firstName: firstName,
      lastName: lastName,
      role: user.role || 'buyer',
      supervisorName: user.supervisorName || '',
      supervisorUid: user.supervisorUid || ''
    });
    setEditValidationErrors({
      email: false,
      firstName: false,
      lastName: false,
      role: false
    });
    setEditFormValid(false);
    setEditSupervisorValue(user.supervisorUid || '');
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    if (isCurrentUser(user)) {
      showAlert('ไม่สามารถลบบัญชีของตัวเองได้', 'error', 'กรุณาติดต่อผู้ดูแลระบบคนอื่นเพื่อลบบัญชีของคุณ');
      return;
    }
    
    setSelectedUser(user);
    setShowDeleteModal(true);
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

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-8 sm:py-12">
          <div className="flex justify-center">
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#2b9ccc]" />
          จัดการผู้ใช้งาน
        </h1>
      </div>

      {alertState.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert 
            variant={getAlertConfig(alertState.type).variant}
            appearance={getAlertConfig(alertState.type).appearance}
            close
            onClose={() => setAlertState(prev => ({ ...prev, show: false }))}
          >
            <AlertIcon>
              {React.createElement(getAlertConfig(alertState.type).IconComponent, { className: "h-4 w-4" })}
            </AlertIcon>
            <AlertTitle>{alertState.title}</AlertTitle>
            {alertState.description && (
              <AlertDescription>{alertState.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}

      <UsersDataTable 
        data={users}
        loading={loading}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onAddUser={() => setShowCreateModal(true)}
        isCurrentUser={isCurrentUser}
      />

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] mx-4" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              เพิ่มผู้ใช้
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              กรอกข้อมูลผู้ใช้ใหม่ในระบบ
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto px-1" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="firstName" className="text-xs sm:text-sm font-medium">
                  ชื่อ <span className="text-destructive">*</span>
                </label>
                <Input 
                  id="firstName"
                  type="text" 
                  className="text-sm"
                  placeholder="กรอกชื่อ"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="lastName" className="text-xs sm:text-sm font-medium">
                  นามสกุล <span className="text-destructive">*</span>
                </label>
                <Input 
                  id="lastName"
                  type="text" 
                  className="text-sm"
                  placeholder="กรอกนามสกุล"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="email" className="text-xs sm:text-sm font-medium">
                อีเมล <span className="text-destructive">*</span>
              </label>
              <Input 
                id="email"
                type="email" 
                className="text-sm"
                placeholder="กรอกอีเมล"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium">
                รหัสผ่าน <span className="text-destructive">*</span>
              </label>
              <Input 
                id="password"
                type="password" 
                className="text-sm"
                placeholder="กรอกรหัสผ่าน"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="department" className="text-xs sm:text-sm font-medium">
                แผนก
              </label>
              <Input
                id="department"
                type="text"
                className="text-sm"
                placeholder="กรอกแผนก"
                value={newUser.department}
                onChange={(e) => setNewUser({...newUser, department: e.target.value})}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="supervisor" className="text-xs sm:text-sm font-medium">
                หัวหน้างาน
              </label>
              <Popover open={supervisorOpen} onOpenChange={setSupervisorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supervisorOpen}
                    className="w-full justify-between text-xs sm:text-sm"
                  >
                    {supervisorValue
                      ? supervisors.find((supervisor) => supervisor.uid === supervisorValue)?.displayName
                      : "เลือกหัวหน้างาน..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="ค้นหาหัวหน้างาน..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบหัวหน้างาน</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setSupervisorValue("");
                            setNewUser({...newUser, supervisorName: '', supervisorUid: ''});
                            setSupervisorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              supervisorValue === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          ไม่มีหัวหน้างาน
                        </CommandItem>
                        {supervisors.map((supervisor) => (
                          <CommandItem
                            key={supervisor.uid}
                            value={supervisor.uid}
                            onSelect={(currentValue) => {
                              setSupervisorValue(currentValue === supervisorValue ? "" : currentValue);
                              setNewUser({
                                ...newUser, 
                                supervisorName: currentValue === supervisorValue ? '' : supervisor.displayName || '',
                                supervisorUid: currentValue === supervisorValue ? '' : supervisor.uid
                              });
                              setSupervisorOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                supervisorValue === supervisor.uid ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {supervisor.displayName || supervisor.email}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="role" className="text-xs sm:text-sm font-medium">
                บทบาท <span className="text-destructive">*</span>
              </label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({...newUser, role: value})}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer" className="text-sm">ผู้ขอซื้อ</SelectItem>
                  <SelectItem value="supervisor" className="text-sm">หัวหน้างาน</SelectItem>
                  <SelectItem value="procurement" className="text-sm">ฝ่ายจัดซื้อ</SelectItem>
                  <SelectItem value="superadmin" className="text-sm">ผู้ดูแลระบบ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button 
                type="button"
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    email: '',
                    firstName: '',
                    lastName: '',
                    password: '',
                    role: 'buyer',
                    supervisorName: '',
                    supervisorUid: '',
                    department: ''
                  });
                  setValidationErrors({
                    email: false,
                    firstName: false,
                    lastName: false,
                    password: false,
                    role: false,
                    supervisorName: false,
                    department: false
                  });
                  setFormValid(false);
                  setSupervisorValue('');
                }}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto bg-[#6EC1E4] hover:bg-[#2b9ccc]"
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
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] mx-4" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              แก้ไขข้อมูลผู้ใช้
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              แก้ไขข้อมูลผู้ใช้ในระบบ
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto px-1" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="edit-firstName" className="text-xs sm:text-sm font-medium">
                  ชื่อ <span className="text-destructive">*</span>
                </label>
                <Input
                  id="edit-firstName"
                  type="text"
                  className={`text-sm ${editValidationErrors.firstName ? 'border-destructive' : ''}`}
                  placeholder="กรอกชื่อ"
                  value={editUser.firstName}
                  onChange={(e) => setEditUser({...editUser, firstName: e.target.value})}
                  minLength={2}
                  required
                />
                {editValidationErrors.firstName && (
                  <p className="text-xs text-destructive">ชื่อต้องมีอย่างน้อย 2 ตัวอักษร</p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="edit-lastName" className="text-xs sm:text-sm font-medium">
                  นามสกุล <span className="text-destructive">*</span>
                </label>
                <Input
                  id="edit-lastName"
                  type="text"
                  className={`text-sm ${editValidationErrors.lastName ? 'border-destructive' : ''}`}
                  placeholder="กรอกนามสกุล"
                  value={editUser.lastName}
                  onChange={(e) => setEditUser({...editUser, lastName: e.target.value})}
                  minLength={2}
                  required
                />
                {editValidationErrors.lastName && (
                  <p className="text-xs text-destructive">นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="edit-email" className="text-xs sm:text-sm font-medium">
                อีเมล <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-email"
                type="email"
                className={`text-sm ${editValidationErrors.email ? 'border-destructive' : ''}`}
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

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="edit-supervisor" className="text-xs sm:text-sm font-medium">
                หัวหน้างาน
              </label>
              <Popover open={editSupervisorOpen} onOpenChange={setEditSupervisorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={editSupervisorOpen}
                    className="w-full justify-between text-xs sm:text-sm"
                  >
                    {editSupervisorValue
                      ? supervisors.find((supervisor) => supervisor.uid === editSupervisorValue)?.displayName
                      : "เลือกหัวหน้างาน..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="ค้นหาหัวหน้างาน..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบหัวหน้างาน</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setEditSupervisorValue("");
                            setEditUser({...editUser, supervisorName: '', supervisorUid: ''});
                            setEditSupervisorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              editSupervisorValue === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          ไม่มีหัวหน้างาน
                        </CommandItem>
                        {supervisors.map((supervisor) => (
                          <CommandItem
                            key={supervisor.uid}
                            value={supervisor.uid}
                            onSelect={(currentValue) => {
                              setEditSupervisorValue(currentValue === editSupervisorValue ? "" : currentValue);
                              setEditUser({
                                ...editUser, 
                                supervisorName: currentValue === editSupervisorValue ? '' : supervisor.displayName || '',
                                supervisorUid: currentValue === editSupervisorValue ? '' : supervisor.uid
                              });
                              setEditSupervisorOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editSupervisorValue === supervisor.uid ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {supervisor.displayName || supervisor.email}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="edit-role" className="text-xs sm:text-sm font-medium">
                บทบาท <span className="text-destructive">*</span>
              </label>
              <Select
                value={editUser.role}
                onValueChange={(value) => setEditUser({...editUser, role: value})}
              >
                <SelectTrigger className={`text-sm ${editValidationErrors.role ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer" className="text-sm">ผู้ขอซื้อ</SelectItem>
                  <SelectItem value="supervisor" className="text-sm">หัวหน้างาน</SelectItem>
                  <SelectItem value="procurement" className="text-sm">ฝ่ายจัดซื้อ</SelectItem>
                  <SelectItem value="superadmin" className="text-sm">ผู้ดูแลระบบ</SelectItem>
                </SelectContent>
              </Select>
              {editValidationErrors.role && (
                <p className="text-xs text-destructive">กรุณาเลือกบทบาท</p>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button 
                type="button"
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => setShowEditModal(false)}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto"
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
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] mx-4" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              ยืนยันการลบผู้ใช้
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              คุณต้องการลบผู้ใช้นี้หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && isCurrentUser(selectedUser) && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>ไม่สามารถลบตัวเองได้</AlertTitle>
              <AlertDescription>
                กรุณาติดต่อผู้ดูแลระบบคนอื่นเพื่อลบบัญชีของคุณ
              </AlertDescription>
            </Alert>
          )}
          
          <div className="py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              ผู้ใช้: {selectedUser?.displayName || selectedUser?.email}
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => setShowDeleteModal(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
              onClick={deleteUser}
              disabled={selectedUser ? isCurrentUser(selectedUser) : false}
            >
              ลบผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}