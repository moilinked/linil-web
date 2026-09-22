"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { adminNavigation } from "@/features/admin/admin-nav"
import { cn } from "@/lib/utils"

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {adminNavigation.map((item) => {
        const isActive = isActivePath(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isActive && "bg-muted font-semibold text-primary hover:text-primary",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
