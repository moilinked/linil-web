import Image from "next/image"
import Link from "next/link"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { siteConfig } from "@/config/site"
import { AuthHeaderActions } from "@/features/auth/components/auth-header-actions"

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/chat" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src={siteConfig.logo}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full"
            priority
          />
          <span>{siteConfig.name}</span>
        </Link>
        <div className="flex items-center gap-3">
          <nav aria-label="主导航" className="flex items-center gap-1">
            {siteConfig.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <AuthHeaderActions />
        </div>
      </div>
    </header>
  )
}
