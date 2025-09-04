import React, { useEffect, useState } from 'react';
import { subscribeAuthAndRole } from '../../lib/auth';

export default function TabNavigation() {
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const off = subscribeAuthAndRole((u, r) => {
      console.log('TabNavigation - User:', u?.email, 'Role:', r);
      setUser(u);
      setRole(r);
      setIsLoading(false);
      
      // Clear any cached role data
      if (r) {
        sessionStorage.setItem('po_user_role', r);
        sessionStorage.setItem('po_user_email', u?.email || '');
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
              Error: No role detected. Please check Firestore users collection.
              <br />
              User: {user?.email || 'None'} | Role: {role || 'None'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start py-4 gap-2">
          
          {/* Debug info - จะลบทิ้งทีหลัง */}
          <div className="text-xs text-gray-400 mr-4 bg-yellow-100 px-2 py-1 rounded">
            {user?.email} | {role}
          </div>
          
          {/* BUYER Navigation */}
          {role === 'buyer' && (
            <>
              <button
                onClick={() => handleTabChange('create', '/orders/create')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'create' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                สร้างใบสั่งซื้อ
              </button>

              <button
                onClick={() => handleTabChange('tracking', '/orders/tracking')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'tracking' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-10.5h5.25l-1.5-1.5 1.5-1.5m-3.75 3h-2.25v12h2.25a.75.75 0 0 0 .75-.75V8.25a.75.75 0 0 0-.75-.75Z" />
                </svg>
                ติดตามสถานะ
              </button>

              <button
                onClick={() => handleTabChange('notifications', '/orders/notifications')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                การแจ้งเตือน
              </button>
            </>
          )}

          {/* SUPERVISOR Navigation */}
          {role === 'supervisor' && (
            <>
              <button
                onClick={() => handleTabChange('tracking', '/orders/tracking')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'tracking' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-10.5h5.25l-1.5-1.5 1.5-1.5m-3.75 3h-2.25v12h2.25a.75.75 0 0 0 .75-.75V8.25a.75.75 0 0 0-.75-.75Z" />
                </svg>
                ติดตามและอนุมัติ
              </button>

              <button
                onClick={() => handleTabChange('list', '/orders/list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'list' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                รายการใบสั่งซื้อ
              </button>

              <button
                onClick={() => handleTabChange('notifications', '/orders/notifications')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'notifications' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                การแจ้งเตือน
              </button>
            </>
          )}

          {/* PROCUREMENT Navigation */}
          {role === 'procurement' && (
            <>
              <button
                onClick={() => handleTabChange('list', '/orders/list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'list' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                รายการใบสั่งซื้อ
              </button>

              <button
                onClick={() => handleTabChange('notifications', '/orders/notifications')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'notifications' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                การแจ้งเตือน
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}