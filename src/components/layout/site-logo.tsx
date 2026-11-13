"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, MessageSquare, NotebookPen, type LucideIcon } from "lucide-react"

import { BrandLogo } from "@/components/layout/brand-logo"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

const navigationIcons: Record<(typeof siteConfig.navigation)[number]["href"], LucideIcon> = {
  "/notes": NotebookPen,
  "/works": Layers,
  "/chat": MessageSquare,
}

function LogoMark() {
  return (
    <span className="pointer-events-none inline-flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#1f2937]/90">
      <BrandLogo priority />
    </span>
  )
}

export function SiteLogo() {
  const pathname = usePathname()

  return (
    <>
      <Link
        href="/chat"
        aria-label={siteConfig.name}
        className="hidden w-fit rounded-full transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 md:inline-flex"
      >
        <LogoMark />
      </Link>
      <Sheet>
        <SheetTrigger
          aria-label="Open menu"
          className="inline-flex rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
        >
          <LogoMark />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72! gap-0 overflow-hidden rounded-r-3xl border-border bg-card p-0 text-card-foreground shadow-(--shadow-panel)"
        >
          <SheetHeader className="gap-3 border-b border-border bg-linear-to-b from-primary/10 to-transparent px-5 pt-6 pb-5">
            <div className="flex items-center gap-3 pr-8">
              <LogoMark />
              <div className="min-w-0">
                <SheetTitle className="text-lg font-semibold tracking-tight">{siteConfig.name}</SheetTitle>
                <SheetDescription className="truncate">{siteConfig.description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <nav aria-label="Main navigation" className="flex flex-col gap-1 px-3 py-4">
            <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Menu</p>
            {siteConfig.navigation.map((item) => {
              const Icon = navigationIcons[item.href]
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <SheetClose
                  key={item.href}
                  nativeButton={false}
                  render={
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                      )}
                    />
                  }
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {item.label}
                </SheetClose>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
