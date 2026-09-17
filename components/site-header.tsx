"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "@/components/ui/mode-toggle";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb";
  import { Separator } from "@/components/ui/separator";
  import { SidebarTrigger } from "@/components/ui/sidebar";
import UserMenu from "@/modules/auth/components/user-menu";

  function useBreadcrumbs() {
    const pathname = usePathname();
  
    if (pathname === "/") {
      return [{ label: "Home", href: null }];
    }
  
    if (pathname === "/dashboard") {
      return [
        { label: "Home", href: "/" },
        { label: "Workspaces", href: null },
      ];
    }
  
    if (pathname.startsWith("/workspaces/")) {
      return [
        { label: "Home", href: "/" },
        { label: "Workspaces", href: "/dashboard" },
        { label: "Workspace", href: null },
      ];
    }
  
    return [{ label: "Home", href: "/" }];
  }
  

  export default function SiteHeader() {
    const crumbs = useBreadcrumbs();
  
    return (
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
  
              return (
                <span key={`${crumb.label}-${index}`} className="contents">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href as Route} />}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu/>
        </div>
      </header>
    );
  }
  