"use client"

import { ArrowUp } from "lucide-react"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const showAfter = 400

function subscribe(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true })
  return () => window.removeEventListener("scroll", onStoreChange)
}

function getSnapshot() {
  return window.scrollY > showAfter
}

function getServerSnapshot() {
  return false
}

export function BackToTop() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      aria-label="回到顶部"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed right-4 bottom-4 z-40 rounded-full shadow-lg transition-opacity duration-200 sm:right-6 sm:bottom-6",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={() => {
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        window.scrollTo({ top: 0, behavior })
      }}
    >
      <ArrowUp aria-hidden="true" />
    </Button>
  )
}
