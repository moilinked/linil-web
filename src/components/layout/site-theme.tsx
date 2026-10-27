"use client"

import { createContext, useContext, useLayoutEffect, useSyncExternalStore, type ReactNode } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

const storageKey = "site-theme"
const themeChangeEvent = "site-theme-change"

type SiteThemeName = "light" | "dark"

type SiteThemeContextValue = {
  theme: SiteThemeName
  toggleTheme: () => void
}

const SiteThemeContext = createContext<SiteThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
})

function readStoredTheme(): SiteThemeName {
  try {
    return localStorage.getItem(storageKey) === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(themeChangeEvent, onStoreChange)
  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(themeChangeEvent, onStoreChange)
  }
}

function applySiteTheme(theme: SiteThemeName) {
  document.body.classList.add("site-theme")
  document.body.classList.toggle("dark", theme === "dark")
}

export function SiteThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readStoredTheme, () => "light" as const)

  useLayoutEffect(() => {
    applySiteTheme(theme)

    return () => {
      document.body.classList.remove("site-theme", "dark")
    }
  }, [theme])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // Preference stays for this page view when storage is unavailable.
    }
    applySiteTheme(next)
    window.dispatchEvent(new Event(themeChangeEvent))
  }

  return <SiteThemeContext.Provider value={{ theme, toggleTheme }}>{children}</SiteThemeContext.Provider>
}

export function SiteThemeToggle() {
  const { theme, toggleTheme } = useContext(SiteThemeContext)
  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      onClick={toggleTheme}
    >
      {isDark ? <Moon /> : <Sun />}
    </Button>
  )
}
