"use client";

import { usePathname } from "next/navigation";

import AppSidebar from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login";
    const isWorkspacePage = pathname.startsWith("/workspaces/");
  
    if (isAuthPage) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-4">{children}</div>
      );
    }
  
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className={isWorkspacePage ? "min-h-svh overflow-hidden" : undefined}>
          <SiteHeader />
          <div className={isWorkspacePage ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex-1"}>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
  