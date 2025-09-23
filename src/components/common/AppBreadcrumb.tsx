"use client"

import React, { useState, useEffect } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function AppBreadcrumb() {
  const [isClient, setIsClient] = useState(false);
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setIsClient(true);
    setPathname(window.location.pathname);
  }, []);
  
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'ระบบใบขอซื้อ', href: '/' }
    ];

    if (pathname === '/') {
      items.push({ label: 'หน้าหลัก' });
    } else if (pathname.startsWith('/orders/create')) {
      items.push({ label: 'สร้างใบขอซื้อ' });
    } else if (pathname.startsWith('/orders/tracking')) {
      items.push({ label: 'ติดตามสถานะ' });
    } else if (pathname.startsWith('/orders/notifications')) {
      items.push({ label: 'การแจ้งเตือน' });
    } else if (pathname.startsWith('/orders/list')) {
      items.push({ label: 'รายการใบสั่งซื้อ' });
    } else if (pathname.startsWith('/orders/')) {
      const orderId = pathname.split('/').pop();
      items.push({ label: 'รายการใบสั่งซื้อ', href: '/orders/list' });
      items.push({ label: `ใบสั่งซื้อ #${orderId}` });
    } else if (pathname.startsWith('/users')) {
      items.push({ label: 'จัดการผู้ใช้งาน' });
    } else if (pathname.startsWith('/login')) {
      items.push({ label: 'เข้าสู่ระบบ' });
    } else {
      const segments = pathname.split('/').filter(Boolean);
      segments.forEach((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        
        if (isLast) {
          items.push({ label: segment });
        } else {
          items.push({ label: segment, href });
        }
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  if (!isClient) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>ระบบใบขอซื้อ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && (
              <BreadcrumbSeparator />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
