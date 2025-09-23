"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { subscribeAuthAndRole } from "@/lib/auth"
import {
  Plus,
  FileText,
  Bell,
  Users,
  List,
  CheckCircle2,
  Building2,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | 'superadmin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    const off = subscribeAuthAndRole((u, r) => {
      console.log('AppSidebar - User:', u?.email, 'Role:', r);
      setUser(u);
      setRole(r);
      setIsLoading(false);

      if (r && u) {
        sessionStorage.setItem('po_user_role', r);
        sessionStorage.setItem('po_user_email', u.email || '');
        sessionStorage.setItem('po_user_data', JSON.stringify(u));
      } else {
        sessionStorage.removeItem('po_user_role');
        sessionStorage.removeItem('po_user_email');
        sessionStorage.removeItem('po_user_data');
      }

      if (!u && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
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
    else if (path.includes('/users')) setActiveTab('users');
    else setActiveTab('');
  }, []);

  const getRoleDisplayName = () => {
    switch (role) {
      case 'buyer': return 'ผู้ขอซื้อ';
      case 'supervisor': return 'หัวหน้างาน';
      case 'procurement': return 'ฝ่ายจัดซื้อ';
      case 'superadmin': return 'ผู้ดูแลระบบ';
      default: return 'กำลังโหลด...';
    }
  };

  const getNavMainItems = () => {
    const baseItems = [];

    if (role === 'buyer') {
      baseItems.push(
        {
          title: "สร้างใบสั่งซื้อ",
          url: "/orders/create",
          icon: Plus,
          isActive: activeTab === 'create',
        },
        {
          title: "ติดตามสถานะ",
          url: "/orders/tracking",
          icon: FileText,
          isActive: activeTab === 'tracking',
        },
        {
          title: "การแจ้งเตือน",
          url: "/orders/notifications",
          icon: Bell,
          isActive: activeTab === 'notifications',
        }
      );
    } else if (role === 'supervisor') {
      baseItems.push(
        {
          title: "ติดตามและอนุมัติ",
          url: "/orders/tracking",
          icon: CheckCircle2,
          isActive: activeTab === 'tracking',
        },
        {
          title: "รายการใบสั่งซื้อ",
          url: "/orders/list",
          icon: List,
          isActive: activeTab === 'list',
        }
      );
    } else if (role === 'procurement') {
      baseItems.push(
        {
          title: "รายการใบสั่งซื้อ",
          url: "/orders/list",
          icon: List,
          isActive: activeTab === 'list',
        },
        {
          title: "ติดตามสถานะ",
          url: "/orders/tracking",
          icon: FileText,
          isActive: activeTab === 'tracking',
        }
      );
    } else if (role === 'superadmin') {
      baseItems.push(
        {
          title: "จัดการผู้ใช้งาน",
          url: "/users",
          icon: Users,
          isActive: activeTab === 'users',
        }
      );
    }

    return baseItems;
  };


  const getTeams = () => {
    return [
      {
        name: "ระบบใบขอซื้อ",
        logo: Building2,
        plan: getRoleDisplayName(),
      },
    ];
  };

  const getUserData = () => {
    if (!user) return { name: "ผู้ใช้", email: "user@example.com", avatar: "" };
    
    return {
      name: user.displayName || user.email?.split('@')[0] || "ผู้ใช้",
      email: user.email || "user@example.com",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&size=64&background=64D1E3&color=ffffff&rounded=true`,
    };
  };

  if (isLoading || !user || !role) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <Building2 className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">ระบบใบขอซื้อ</span>
                <span className="text-xs text-muted-foreground">กำลังโหลด...</span>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={getTeams()} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getNavMainItems()} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={getUserData()} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
