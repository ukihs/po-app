import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { AppSidebar } from './app-sidebar';
import AppBreadcrumb from './AppBreadcrumb';
import { StoreInitializer } from '../../stores';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <StoreInitializer>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <AppBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col p-6 bg-background">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StoreInitializer>
  );
}