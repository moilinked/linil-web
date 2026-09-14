"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

export function SiteNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-7">
      {siteConfig.navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-2 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:px-0 sm:text-base",
              isActive && "font-bold text-primary hover:text-primary-hover",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
