import React, { useEffect, useState } from 'react';
import { subscribeAuthAndRole, signOutUser } from '../../lib/auth';

export default function Header() {
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | null>(null);

  useEffect(() => {
    const off = subscribeAuthAndRole((user, r) => {
      setRole(r);
      // ถ้าไม่มี user ให้เด้งไปหน้า login
      if (!user && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    });
    return off;
  }, []);

  return (
    <header className="w-full border-b bg-white/60 backdrop-blur">
      <div className="container-nice py-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">ระบบใบสั่งซื้อ</div>
          <div className="text-xs text-slate-500">Purchase Order Management System</div>
        </div>

        <nav className="flex items-center gap-6">
          {role === 'buyer' && (
            <>
              <a className="navlink" href="/orders/create">สร้างใบสั่งซื้อ</a>
              <a className="navlink" href="/orders/tracking">ติดตามสถานะ</a>
              <a className="navlink" href="/orders/notifications">การแจ้งเตือน</a>
            </>
          )}

          {role === 'supervisor' && (
            <>
              <a className="navlink" href="/orders/list">รายการใบสั่งซื้อ</a>
              <a className="navlink" href="/orders/notifications">การแจ้งเตือน</a>
            </>
          )}

          {role === 'procurement' && (
            <>
              <a className="navlink" href="/orders/list">รายการใบสั่งซื้อ</a>
              <a className="navlink" href="/orders/notifications">การแจ้งเตือน</a>
            </>
          )}

          <button className="text-sm text-slate-600 hover:text-slate-900" onClick={signOutUser}>
            ออกจากระบบ
          </button>
        </nav>
      </div>
    </header>
  );
}
