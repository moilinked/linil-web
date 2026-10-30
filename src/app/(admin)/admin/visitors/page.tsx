import type { Metadata } from "next"

import { loadVisitorSessions } from "@/features/admin/analytics/load-sessions"
import { VisitorSessionList } from "@/features/admin/analytics/visitor-sessions"

export const metadata: Metadata = {
  title: "Visitors",
  description: "Anonymous visitor sessions",
}

export default async function AdminVisitorsPage() {
  const result = await loadVisitorSessions()

  return <VisitorSessionList result={result} />
}
