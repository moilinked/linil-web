import Script from "next/script"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteThemeProvider } from "@/components/layout/site-theme"
import { AuthProvider } from "@/features/auth/components/auth-provider"
import { getSessionUser } from "@/features/auth/session"

const umamiWebsiteId = "8258e751-f426-4e49-8d9d-25b71fb7112a"

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser()

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
      <Script
        defer
        src="https://analytics.oilinil.cn/script.js"
        data-website-id={umamiWebsiteId}
        strategy="afterInteractive"
      />
    </AuthProvider>
  )
}
