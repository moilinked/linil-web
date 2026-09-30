"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { isSettingsItemActive, settingsNavigation } from "@/features/admin/settings/settings-nav"
import { cn } from "@/lib/utils"

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and set e-mail preferences.</p>
      </div>
      <Separator />
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-12">
        <aside className="lg:w-48 lg:shrink-0">
          <div className="lg:hidden">
            <Select
              value={settingsNavigation.find((item) => isSettingsItemActive(pathname, item.href))?.href}
              onValueChange={(value) => {
                if (value) {
                  router.push(value)
                }
              }}
            >
              <SelectTrigger className="w-full" aria-label="Settings section">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {settingsNavigation.map((item) => (
                  <SelectItem key={item.href} value={item.href}>
                    <item.icon />
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <nav className="hidden flex-col gap-1 lg:flex">
            {settingsNavigation.map((item) => {
              const isActive = isSettingsItemActive(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start",
                    isActive ? "bg-muted hover:bg-muted" : "hover:bg-muted",
                  )}
                >
                  <item.icon />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
