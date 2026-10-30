import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadVisitorSession, visitorSessionIdPattern } from "@/features/admin/analytics/load-sessions"
import { VisitorSessionDetail } from "@/features/admin/analytics/visitor-sessions"

export const metadata: Metadata = {
  title: "Visitor",
  description: "Anonymous visitor session",
}

export default async function AdminVisitorPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  if (!visitorSessionIdPattern.test(sessionId)) {
    notFound()
  }

  const result = await loadVisitorSession(sessionId)

  return <VisitorSessionDetail result={result} />
}
