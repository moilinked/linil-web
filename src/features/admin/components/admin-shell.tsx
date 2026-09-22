import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { siteConfig } from "@/config/site"
import { AdminNavigation } from "@/features/admin/components/admin-navigation"
import { AuthHeaderActions } from "@/features/auth/components/auth-header-actions"

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-[12px] sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-full transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Image src={siteConfig.logo} alt="" width={32} height={32} className="size-8 rounded-full" />
            <span className="text-sm font-semibold tracking-tight sm:text-base">{siteConfig.name} Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Site
            </Link>
            <AuthHeaderActions />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:flex-row sm:px-6">
        <aside className="w-full shrink-0 sm:w-52">
          <AdminNavigation />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
