import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { isAdminName } from "@/config/admin"
import { AdminForbidden } from "@/features/admin/components/admin-forbidden"
import { AdminShell } from "@/features/admin/components/admin-shell"
import { AuthProvider } from "@/features/auth/components/auth-provider"
import { getSessionUser } from "@/features/auth/session"

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"
  const user = await getSessionUser()

  if (!user) {
    redirect("/login?next=/admin")
  }

  if (!isAdminName(user.name)) {
    return <AdminForbidden />
  }

  return (
    <AuthProvider initialUser={user}>
      <AdminShell defaultOpen={defaultOpen}>{children}</AdminShell>
    </AuthProvider>
  )
}
