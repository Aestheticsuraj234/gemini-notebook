"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen02Icon,
  FolderKanbanIcon,
  Home01Icon,
  Layers01Icon,
  MessageSquareIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const mainNav = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/dashboard", label: "Workspaces", icon: FolderKanbanIcon },
] as const

const featureNav = [
  { label: "Sources", icon: Layers01Icon },
  { label: "Chat", icon: MessageSquareIcon },
  { label: "Artifacts", icon: SparklesIcon },
] as const

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">NotebookLLM</span>
                <span className="truncate text-xs text-muted-foreground">Study workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(({ href, label, icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={pathname === href || (href !== "/" && pathname.startsWith(href))}
                    tooltip={label}
                    render={<Link href={href} />}
                  >
                    <HugeiconsIcon icon={icon} strokeWidth={2} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {featureNav.map(({ label, icon }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton tooltip={label} className="pointer-events-none opacity-70">
                    <HugeiconsIcon icon={icon} strokeWidth={2} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} tooltip="Open dashboard">
              <HugeiconsIcon icon={FolderKanbanIcon} strokeWidth={2} />
              <span>Manage workspaces</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
