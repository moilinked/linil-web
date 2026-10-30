import Script from "next/script"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteThemeProvider } from "@/components/layout/site-theme"
import { getUmamiTracking } from "@/config/umami"
import { AuthProvider } from "@/features/auth/components/auth-provider"
import { getSessionUser } from "@/features/auth/session"

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser()
  const umami = getUmamiTracking()

  return (
    <AuthProvider initialUser={user}>
      <SiteThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var dark=true;try{dark=localStorage.getItem("site-theme")!=="light"}catch(e){}document.body.classList.add("site-theme");document.body.classList.toggle("dark",dark)})()',
          }}
        />
        <div className="flex flex-col">
          <SiteHeader />
          <main className="flex flex-col">{children}</main>
          <SiteFooter />
        </div>
      </SiteThemeProvider>
      <Script defer src={umami.scriptSrc} data-website-id={umami.websiteId} strategy="afterInteractive" />
    </AuthProvider>
  )
}
