"use client"

import { useEffect, useState, type ReactNode } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdminHeader } from "@/features/admin/components/admin-header"
import { AdminSidebar } from "@/features/admin/components/admin-sidebar"
import { cn } from "@/lib/utils"

export function AdminShell({ children, defaultOpen }: { children: ReactNode; defaultOpen: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const root = document.body
    root.classList.add("admin-theme")
    root.classList.toggle("dark", theme === "dark")

    return () => {
      root.classList.remove("admin-theme", "dark")
    }
  }, [theme])

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        className={cn("admin-theme min-h-svh bg-background", theme === "dark" && "dark")}
      >
        <AdminSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <AdminHeader
            theme={theme}
            onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          />
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
