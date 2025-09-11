import React, { useEffect, useState } from 'react';
import { subscribeAuthAndRole, signOutUser } from '../../lib/auth';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const off = subscribeAuthAndRole((u, r) => {
      console.log('Header - User:', u?.email, 'Role:', r); // Debug log
      setUser(u);
      setIsLoading(false);
      
      if (u) {
        sessionStorage.setItem('po_user_data', JSON.stringify(u));
      } else {
        sessionStorage.removeItem('po_user_data');
      }
      
      if (!u && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    });
    return off;
  }, []);

  const getAvatarUrl = () => {
    if (!user?.email) return '';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&size=64&background=64D1E3&color=ffffff&rounded=true`;
  };

  if (isLoading) {
    return (
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Bederly Logo" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <div className="text-lg font-semibold text-gray-900">ระบบใบขอซื้อ</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Bederly Logo" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <div className="text-lg font-semibold text-gray-900">ระบบใบขอซื้อ</div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Bederly Logo" 
              className="h-8 w-auto object-contain"
            />
            <div>
              <div className="text-lg font-semibold text-gray-900">ระบบใบขอซื้อ</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-gray-600">
              {user.displayName || user.email?.split('@')[0]}
            </div>
            
            <div className="relative">
              <button 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => {
                  const dropdown = document.getElementById('user-dropdown');
                  dropdown?.classList.toggle('hidden');
                }}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200">
                  <img 
                    src={getAvatarUrl()} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div 
                id="user-dropdown"
                className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                <div className="p-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.email}
                  </div>
                </div>
                <div className="p-1">
                  <button
                    onClick={signOutUser}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                    </svg>
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}