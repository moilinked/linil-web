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
      size="icon-sm"
      aria-label={isDark ? "切换到白天模式" : "切换到暗夜模式"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
