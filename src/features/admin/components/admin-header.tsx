"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AdminHeader({ theme, onToggleTheme }: { theme: "dark" | "light"; onToggleTheme: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 bg-background px-4">
      <SidebarTrigger variant="outline" size="icon" />
      <div className="flex h-6 items-center">
        <Separator orientation="vertical" />
      </div>
      <div className="ms-auto flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Moon /> : <Sun />}
        </Button>
      </div>
    </header>
  )
}
