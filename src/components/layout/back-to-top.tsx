"use client"

import { ArrowUp } from "lucide-react"
import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

const screensBeforeShow = 3

function subscribe(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true })
  window.addEventListener("resize", onStoreChange)
  return () => {
    window.removeEventListener("scroll", onStoreChange)
    window.removeEventListener("resize", onStoreChange)
  }
}

function getSnapshot() {
  return window.scrollY > window.innerHeight * screensBeforeShow
}

function getServerSnapshot() {
  return false
}

export function BackToTop() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <button
      type="button"
      aria-label="Back to Top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{
        background:
          "conic-gradient(var(--primary) calc(var(--scroll-progress, 0) * 1turn), color-mix(in srgb, var(--primary) 25%, transparent) calc(var(--scroll-progress, 0) * 1turn))",
      }}
      className={cn(
        "back-to-top group fixed right-4 bottom-4 z-40 h-14.5 w-14.5 cursor-pointer rounded-full border-none p-1 font-semibold transition-[width,border-radius,opacity] duration-300 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-6 sm:bottom-6",
        "hover:w-37 hover:rounded-[29px]",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={() => {
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        window.scrollTo({ top: 0, behavior })
      }}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[rgb(20,20,20)] transition-[border-radius,background-color] duration-300 group-hover:rounded-[25px] group-hover:bg-primary">
        <ArrowUp
          aria-hidden="true"
          className="size-6 text-white transition-transform duration-300 group-hover:translate-y-[-400%]"
        />
        <span className="pointer-events-none absolute -bottom-5 text-[0px] whitespace-nowrap text-primary-foreground transition-all duration-300 group-hover:bottom-auto group-hover:text-[13px]">
          Back to Top
        </span>
      </span>
    </button>
  )
}
