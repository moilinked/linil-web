"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

function subscribe() {
  return () => {}
}

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

export function ThemeToggle() {
  const isClient = useIsClient()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = !isClient || resolvedTheme !== "light"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className="size-11 rounded-full"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun aria-hidden="true" className="size-5" /> : <Moon aria-hidden="true" className="size-5" />}
    </Button>
  )
}
