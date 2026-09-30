"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, ChevronsUpDown, LogOut, Settings } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { adminNavigation, adminSiteLink, isAdminPathActive } from "@/features/admin/admin-nav"
import { isSettingsItemActive, settingsNavigation } from "@/features/admin/settings/settings-nav"
import { useAuth } from "@/features/auth/auth-context"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
  }

  return name.trim().slice(0, 2).toUpperCase()
}

function AdminBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!">
          <Image src={siteConfig.logo} alt="" width={32} height={32} className="size-8 rounded-full" />
          <div className="grid flex-1 text-start leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">{siteConfig.name} Admin</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AdminNavUser() {
  const { user, logout } = useAuth()
  const { isMobile } = useSidebar()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const name = user?.name ?? "Admin"

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground">Administrator</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate text-sm font-medium">{name}</span>
                <span className="block truncate text-xs text-muted-foreground">Administrator</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} variant="destructive">
              <LogOut />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const SiteIcon = adminSiteLink.icon
  const settingsActive = pathname.startsWith("/admin/settings")
  const [settingsOpen, setSettingsOpen] = useState(settingsActive)

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <AdminBrand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarMenu>
            {adminNavigation.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isAdminPathActive(pathname, item.href)}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Settings"
                isActive={settingsActive}
                onClick={() => setSettingsOpen((open) => !open)}
              >
                <Settings />
                <span>Settings</span>
                <ChevronRight className={cn("ml-auto transition-transform", settingsOpen && "rotate-90")} />
              </SidebarMenuButton>
              {settingsOpen ? (
                <SidebarMenuSub>
                  {settingsNavigation.map((item) => (
                    <SidebarMenuSubItem key={item.href}>
                      <SidebarMenuSubButton
                        isActive={isSettingsItemActive(pathname, item.href)}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={adminSiteLink.title} render={<Link href={adminSiteLink.href} />}>
                <SiteIcon />
                <span>{adminSiteLink.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
