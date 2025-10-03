"use client"

import { useCallback } from "react"
import { type LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: React.ReactNode;
}

export function NavMain({ items }: { items: NavItem[] }) {
  const handleItemClick = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      import('astro:transitions/client')
        .then(({ navigate }) => navigate(url))
        .catch(() => { window.location.href = url; });
    }
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              tooltip={item.title}
              isActive={item.isActive}
              onClick={() => handleItemClick(item.url)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <div className="ml-auto">
                  {item.badge}
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
