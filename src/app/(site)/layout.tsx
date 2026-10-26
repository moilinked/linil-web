import Script from "next/script"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { AuthProvider } from "@/features/auth/components/auth-provider"
import { getSessionUser } from "@/features/auth/session"

const umamiWebsiteId = "8258e751-f426-4e49-8d9d-25b71fb7112a"

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser()

  return (
    <AuthProvider initialUser={user}>
      <div className="flex flex-col">
        <SiteHeader />
        <main className="flex flex-col">{children}</main>
        <SiteFooter />
      </div>
      <Script
        defer
        src="https://analytics.oilinil.cn/script.js"
        data-website-id={umamiWebsiteId}
        strategy="afterInteractive"
      />
    </AuthProvider>
  )
}
