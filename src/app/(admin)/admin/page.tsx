import type { Metadata } from "next"

import { loadAdminAnalytics } from "@/features/admin/analytics/load-analytics"
import { AdminDashboard } from "@/features/admin/components/admin-dashboard"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard",
}

export default async function AdminPage() {
  const analytics = await loadAdminAnalytics()

  return <AdminDashboard analytics={analytics} />
}
