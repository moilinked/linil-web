import { SiteHeader } from "@/components/layout/site-header"
import { AuthProvider } from "@/features/auth/components/auth-provider"
import { getSessionUser } from "@/features/auth/session"

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser()

  return (
    <AuthProvider initialUser={user}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1">{children}</main>
      </div>
    </AuthProvider>
  )
}
