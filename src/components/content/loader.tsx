"use client"

import { Suspense, use } from "react"
import { browser, createPortal } from "react-dom"

import { cn } from "@/lib/utils"

interface LoaderProps {
  text: string
  className?: string
}

export function Loader(props: LoaderProps) {
  return (
    <Suspense fallback={null}>
      <BrowserLoader {...props} />
    </Suspense>
  )
}

function BrowserLoader({ text, className }: LoaderProps) {
  use(browser("The loader is rendered in the browser."))

  return createPortal(
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", className)} role="status">
      <div className="text-sm font-black *:text-foreground">
        <span className="inline-flex">&lt;</span>
        <span className="inline-flex animate-reveal overflow-hidden tracking-[-1em]">{text}</span>
        <span className="inline-flex">/&gt;</span>
      </div>
    </div>,
    document.body,
  )
}
