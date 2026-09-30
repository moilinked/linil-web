"use client"

import { Moon, Search, Sun } from "lucide-react"

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
          variant="outline"
          className="relative hidden h-8 w-40 justify-start! px-8 font-normal text-muted-foreground md:inline-flex lg:w-52 xl:w-64"
        >
          <Search className="absolute left-2.5 size-4" />
          <span>Search</span>
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-1.5 hidden h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex"
          >
            ⌘K
          </kbd>
        </Button>
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
