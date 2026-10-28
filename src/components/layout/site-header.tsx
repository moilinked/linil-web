import { SiteLogo } from "@/components/layout/site-logo"
import { SiteNavigation } from "@/components/layout/site-navigation"
import { SiteThemeToggle } from "@/components/layout/site-theme"
import { AuthHeaderActions } from "@/features/auth/components/auth-header-actions"

export function SiteHeader() {
  return (
    <header className="w-full px-3 py-3 sm:px-6">
      <div className="mx-auto grid min-h-17.5 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center rounded-full border border-border bg-card/90 px-4 shadow-(--shadow-panel) backdrop-blur-md sm:px-6.25">
        <SiteLogo />
        <SiteNavigation />
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <SiteThemeToggle />
          <AuthHeaderActions />
        </div>
      </div>
    </header>
  )
}
