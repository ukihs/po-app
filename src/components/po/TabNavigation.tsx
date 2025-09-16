import React, { useEffect, useState } from 'react';
import { subscribeAuthAndRole } from '../../lib/auth';
import { 
  Plus, 
  FileText, 
  Bell, 
  Users, 
  List,
  CheckCircle2
} from 'lucide-react';

export default function TabNavigation() {
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | 'superadmin' | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const off = subscribeAuthAndRole((u, r) => {
      console.log('TabNavigation - User:', u?.email, 'Role:', r);
      setUser(u);
      setRole(r);
      setIsLoading(false);

      if (r && u) {
        sessionStorage.setItem('po_user_role', r);
        sessionStorage.setItem('po_user_email', u.email || '');
      } else {
        sessionStorage.removeItem('po_user_role');
        sessionStorage.removeItem('po_user_email');
      }
    });
    return off;
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/create')) setActiveTab('create');
    else if (path.includes('/tracking')) setActiveTab('tracking');
    else if (path.includes('/notifications')) setActiveTab('notifications');
    else if (path.includes('/list')) setActiveTab('list');
    else setActiveTab('');
  }, []);

  const handleTabChange = (tab: string, url: string) => {
    setActiveTab(tab);
    window.location.href = url;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-start py-4">
            <div className="animate-pulse flex space-x-4">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!role || !user) {
    return (
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-start py-4">
            <div className="text-red-600 text-sm">
              กำลังโหลดข้อมูลผู้ใช้...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getTabClass = (tabName: string, themeColor: string) => {
    const baseClass = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ";
    if (activeTab === tabName) {
      return baseClass + `bg-${themeColor}-100 text-${themeColor}-700 border border-${themeColor}-200`;
    }
    return baseClass + "text-gray-600 hover:bg-gray-100 border border-transparent";
  };

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start py-4 gap-2">

          {role === 'buyer' && (
            <>
              <button
                onClick={() => handleTabChange('create', '/orders/create')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'create'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <Plus className="w-4 h-4" />
                สร้างใบสั่งซื้อ
              </button>

              <button
                onClick={() => handleTabChange('tracking', '/orders/tracking')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'tracking'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <FileText className="w-4 h-4" />
                ติดตามสถานะ
              </button>

              <button
                onClick={() => handleTabChange('notifications', '/orders/notifications')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'notifications'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <Bell className="w-4 h-4" />
                การแจ้งเตือน
              </button>
            </>
          )}

          {role === 'supervisor' && (
            <>
              <button
                onClick={() => handleTabChange('tracking', '/orders/tracking')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'tracking'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                ติดตามและอนุมัติ
              </button>

              <button
                onClick={() => handleTabChange('list', '/orders/list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'list'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <List className="w-4 h-4" />
                รายการใบสั่งซื้อ
              </button>
            </>
          )}

          {role === 'procurement' && (
            <>
              <button
                onClick={() => handleTabChange('list', '/orders/list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'list'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <List className="w-4 h-4" />
                รายการใบสั่งซื้อ
              </button>

              <button
                onClick={() => handleTabChange('tracking', '/orders/tracking')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'tracking'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <FileText className="w-4 h-4" />
                ติดตามสถานะ
              </button>
            </>
          )}

          {role === 'superadmin' && (
            <>
              <button
                onClick={() => handleTabChange('users', '/users')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'users'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <Users className="w-4 h-4" />
                จัดการผู้ใช้งาน
              </button>

              <button
                onClick={() => handleTabChange('list', '/orders/list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'list'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <List className="w-4 h-4" />
                รายการใบสั่งซื้อ
              </button>

              <button
                onClick={() => handleTabChange('tracking', '/orders/tracking')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'tracking'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
              >
                <FileText className="w-4 h-4" />
                ติดตามสถานะ
              </button>
            </>
          )}

          <div className="ml-auto flex items-center">
            <div className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {role === 'buyer' ? 'ผู้ขอซื้อ' :
                role === 'supervisor' ? 'หัวหน้างาน' :
                  role === 'procurement' ? 'ฝ่ายจัดซื้อ' :
                    role === 'superadmin' ? 'ผู้ดูแลระบบ' :
                      'กำลังโหลด...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}