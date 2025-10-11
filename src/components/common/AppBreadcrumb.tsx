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
import { useOrderById, useRole } from '../../stores';
import { getDisplayOrderNumber } from '../../lib/order-utils';
import { DEFAULT_ROUTE_BY_ROLE } from '../../lib/constants';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function AppBreadcrumb() {
  const [isClient, setIsClient] = useState(false);
  const [pathname, setPathname] = useState('');
  const role = useRole();
  
  const orderId = pathname.startsWith('/orders/') && pathname !== '/orders/create' && 
                  pathname !== '/orders/tracking' && pathname !== '/orders/notifications' && 
                  pathname !== '/orders/list' 
                  ? pathname.split('/').pop() 
                  : null;
  
  const order = useOrderById(orderId || '');
  

  useEffect(() => {
    setIsClient(true);
    setPathname(window.location.pathname);
    
    const handleNavigation = () => {
      setPathname(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('astro:page-load', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('astro:page-load', handleNavigation);
    };
  }, []);
  
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const homeRoute = role ? DEFAULT_ROUTE_BY_ROLE[role] : '/login';
    
    const items: BreadcrumbItem[] = [
      { label: 'ระบบใบขอซื้อ', href: homeRoute }
    ];

    if (pathname === '/' || pathname === homeRoute) {
      items.push({ label: 'หน้าหลัก' });
    } else if (pathname.startsWith('/orders/create')) {
      items.push({ label: 'สร้างใบขอซื้อ' });
    } else if (pathname.startsWith('/orders/tracking')) {
      items.push({ label: 'ติดตามสถานะ' });
    } else if (pathname.startsWith('/orders/notifications')) {
      items.push({ label: 'การแจ้งเตือน' });
    } else if (pathname.startsWith('/orders/list')) {
      items.push({ label: 'รายการใบขอซื้อ' });
    } else if (pathname.startsWith('/orders/')) {
      const displayOrderNo = order ? getDisplayOrderNumber(order) : 'กำลังโหลด...';
      items.push({ label: `ใบขอซื้อ ${displayOrderNo}` });
    } else if (pathname.startsWith('/admin/users')) {
      items.push({ label: 'จัดการผู้ใช้งาน' });
    } else if (pathname.startsWith('/admin/orders')) {
      items.push({ label: 'จัดการใบขอซื้อ' });
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
                <BreadcrumbLink href={item.href} className="hover:text-primary">
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-foreground">
                  {item.label}
                </BreadcrumbPage>
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