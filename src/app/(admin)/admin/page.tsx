import type { Metadata } from "next"

import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin overview",
}

export default function AdminPage() {
  return (
    <AdminPageHeading
      title="Overview"
      description="Manage notes and accounts from this workspace. Content tools will be added next."
    />
  )
}
