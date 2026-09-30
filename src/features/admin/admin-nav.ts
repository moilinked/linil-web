import { Files, Globe, LayoutDashboard, StickyNote, Users, type LucideIcon } from "lucide-react"

export interface AdminNavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const adminNavigation: AdminNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Notes", href: "/admin/notes", icon: StickyNote },
  { title: "Files", href: "/admin/files", icon: Files },
  { title: "Accounts", href: "/admin/accounts", icon: Users },
]

export const adminSiteLink = {
  title: "Site",
  href: "/chat",
  icon: Globe,
} as const

export function isAdminPathActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
