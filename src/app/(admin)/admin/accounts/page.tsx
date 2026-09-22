import type { Metadata } from "next"

import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"

export const metadata: Metadata = {
  title: "Accounts",
  description: "Manage accounts",
}

export default function AdminAccountsPage() {
  return (
    <AdminPageHeading
      title="Accounts"
      description="Review and manage user accounts here. Account APIs are not connected yet."
    />
  )
}
