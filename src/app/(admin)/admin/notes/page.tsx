import type { Metadata } from "next"

import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"

export const metadata: Metadata = {
  title: "Notes",
  description: "Manage notes",
}

export default function AdminNotesPage() {
  return <AdminPageHeading title="Notes" description="Create and edit notes here. The editor is not connected yet." />
}
