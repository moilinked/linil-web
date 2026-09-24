import { SiteLogo } from "@/components/layout/site-logo"
import { SiteNavigation } from "@/components/layout/site-navigation"
import { AuthHeaderActions } from "@/features/auth/components/auth-header-actions"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full px-3 py-3 sm:px-6">
      <div className="mx-auto grid min-h-[70px] w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center rounded-full border border-border bg-card/80 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-[12px] sm:px-[25px]">
        <SiteLogo />
        <SiteNavigation />
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <AuthHeaderActions />
        </div>
      </div>
    </header>
  )
}
