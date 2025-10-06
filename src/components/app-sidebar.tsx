"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/types"
import { ROLE_DISPLAY_NAMES } from "@/lib/constants"
import {
  Plus,
  FileText,
  Bell,
  Users,
  List,
  CheckCircle2,
  Building2,
  ShoppingCart,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react"
import NotificationBadge from "./NotificationBadge"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: React.ReactNode;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, role, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    const updateActiveTab = () => {
      const path = window.location.pathname;
      const tabMap: Record<string, string> = {
        '/create': 'create',
        '/tracking': 'tracking',
        '/notifications': 'notifications',
        '/list': 'list',
        '/users': 'users',
        '/admin/users': 'admin-users',
        '/admin/orders': 'admin-orders'
      };
      
      const activeTab = Object.entries(tabMap).find(([key]) => path.includes(key))?.[1] || '';
      setActiveTab(activeTab);
    };

    updateActiveTab();

    const handleNavigation = () => {
      setTimeout(updateActiveTab, 100);
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('astro:page-load', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('astro:page-load', handleNavigation);
    };
  }, []);

  const getRoleDisplayName = useCallback(() => {
    return role ? ROLE_DISPLAY_NAMES[role] : 'กำลังโหลด...';
  }, [role]);

  const getNavMainItems = useMemo((): NavItem[] => {
    const roleMenus: Record<UserRole, NavItem[]> = {
      buyer: [
        { title: "สร้างใบสั่งซื้อ", url: "/orders/create", icon: Plus, isActive: activeTab === 'create' },
        { title: "ติดตามสถานะ", url: "/orders/tracking", icon: FileText, isActive: activeTab === 'tracking' },
        { 
          title: "การแจ้งเตือน", 
          url: "/orders/notifications", 
          icon: Bell, 
          isActive: activeTab === 'notifications',
          badge: <NotificationBadge />
        }
      ],
      supervisor: [
        { 
          title: "ติดตามและอนุมัติ", 
          url: "/orders/tracking", 
          icon: CheckCircle2, 
          isActive: activeTab === 'tracking'
        },
        { title: "รายการใบขอซื้อ", url: "/orders/list", icon: List, isActive: activeTab === 'list' },
        { 
          title: "การแจ้งเตือน", 
          url: "/orders/notifications", 
          icon: Bell, 
          isActive: activeTab === 'notifications',
          badge: <NotificationBadge />
        }
      ],
      procurement: [
        { 
          title: "รายการใบขอซื้อ", 
          url: "/orders/list", 
          icon: ShoppingCart, 
          isActive: activeTab === 'list'
        },
        { title: "ติดตามสถานะ", url: "/orders/tracking", icon: Package, isActive: activeTab === 'tracking' },
        { 
          title: "การแจ้งเตือน", 
          url: "/orders/notifications", 
          icon: Bell, 
          isActive: activeTab === 'notifications',
          badge: <NotificationBadge />
        }
      ],
      superadmin: [
        { title: "จัดการผู้ใช้งาน", url: "/admin/users", icon: Users, isActive: activeTab === 'admin-users' },
        { title: "จัดการใบขอซื้อ", url: "/admin/orders", icon: FileText, isActive: activeTab === 'admin-orders' }
      ]
    };

    return role ? (roleMenus[role] || []) : [];
  }, [role, activeTab]);


  const getTeams = useMemo(() => [{
    name: "ระบบใบขอซื้อ",
    logo: Building2,
    plan: getRoleDisplayName(),
  }], [getRoleDisplayName]);

  const getUserData = useMemo(() => {
    if (!user) return { name: "ผู้ใช้", email: "user@example.com", avatar: "" };
    
    const displayName = user.displayName || user.email?.split('@')[0] || "ผู้ใช้";
    const email = user.email || "user@example.com";
    
    return {
      name: displayName,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=64&background=64D1E3&color=ffffff&rounded=true`,
    };
  }, [user]);

  if (isLoading || !user || !role) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-center pt-2 pb-2">
            <img src="/logo.png" alt="Bederly Logo" className="h-10 w-auto object-contain" />
          </div>
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
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <div className="flex h-8 items-center gap-2 rounded-md px-2">
                    <div className="size-4 bg-sidebar-accent rounded animate-pulse"></div>
                    <div className="h-4 bg-sidebar-accent rounded animate-pulse flex-1"></div>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center pt-2 pb-2">
          <img src="/logo.png" alt="Bederly Logo" className="h-10 w-auto object-contain" />
        </div>
        <TeamSwitcher teams={getTeams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getNavMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={getUserData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}