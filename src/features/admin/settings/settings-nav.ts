import { Bell, Monitor, Palette, UserCog, Wrench, type LucideIcon } from "lucide-react"

export interface SettingsNavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const settingsNavigation: SettingsNavItem[] = [
  { title: "Profile", href: "/admin/settings", icon: UserCog },
  { title: "Account", href: "/admin/settings/account", icon: Wrench },
  { title: "Appearance", href: "/admin/settings/appearance", icon: Palette },
  { title: "Notifications", href: "/admin/settings/notifications", icon: Bell },
  { title: "Display", href: "/admin/settings/display", icon: Monitor },
]

export function isSettingsItemActive(pathname: string, href: string) {
  if (href === "/admin/settings") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
