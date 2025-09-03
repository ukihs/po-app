// src/components/po/Header.tsx
import React, { useEffect, useState } from 'react';
import { subscribeAuthAndRole, signOutUser } from '../../lib/auth';

type Role = 'buyer' | 'supervisor' | 'procurement';

export default function Header() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = subscribeAuthAndRole((user, r) => {
      setRole(r ?? null);
      setLoading(false);
      if (!user) window.location.href = '/login';
    });
    return off;
  }, []);

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur z-40">
      <div className="container-nice py-3 flex items-center justify-between">
        {/* ซ้าย: โลโก้/ชื่อระบบ */}
        <a href="/orders/create" className="leading-tight">
          <div className="text-lg font-semibold">ระบบใบสั่งซื้อ</div>
          <div className="text-xs text-slate-500">Purchase Order Management System</div>
        </a>

        {/* ขวา: เมนูตาม role + ออกจากระบบ */}
        <nav className="flex items-center gap-6">
          {!loading && role === 'buyer' && (
            <>
              <a className="navlink" href="/orders/create">สร้างใบสั่งซื้อ</a>
              <a className="navlink" href="/orders/tracking">ติดตามสถานะ</a>
              <a className="navlink" href="/notifications">การแจ้งเตือน</a>
            </>
          )}

          {!loading && role === 'supervisor' && (
            <>
              <a className="navlink" href="/orders/list">รายการใบสั่งซื้อ</a>
              <a className="navlink" href="/notifications">การแจ้งเตือน</a>
            </>
          )}

          {!loading && role === 'procurement' && (
            <>
              <a className="navlink" href="/orders/list">รายการใบสั่งซื้อ</a>
              <a className="navlink" href="/notifications">การแจ้งเตือน</a>
            </>
          )}

          <button
            onClick={signOutUser}
            title="ออกจากระบบ"
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-2"
          >
            <span aria-hidden>⎋</span>
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
