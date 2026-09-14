import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { AuthProvider } from "@/features/auth/components/auth-provider"
import { getSessionUser } from "@/features/auth/session"

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser()

  return (
    <AuthProvider initialUser={user}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <SiteHeader />
        <main className="flex min-h-0 flex-1 overflow-hidden">{children}</main>
        <SiteFooter />
      </div>
    </AuthProvider>
  )
}
