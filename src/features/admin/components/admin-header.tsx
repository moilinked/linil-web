"use client"

import { createContext, useContext, type ReactNode, type Ref } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const EditorActionsSlotContext = createContext<HTMLElement | null>(null)

export function EditorActionsSlotProvider({ slot, children }: { slot: HTMLElement | null; children: ReactNode }) {
  return <EditorActionsSlotContext.Provider value={slot}>{children}</EditorActionsSlotContext.Provider>
}

export function useEditorActionsSlot() {
  return useContext(EditorActionsSlotContext)
}

export function AdminHeader({
  theme,
  onToggleTheme,
  actionsSlotRef,
}: {
  theme: "dark" | "light"
  onToggleTheme: () => void
  actionsSlotRef: Ref<HTMLDivElement>
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 bg-background px-4">
      <div
        ref={actionsSlotRef}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      />
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
