import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { parseArticleId, parsePublishedAt } from "@/features/admin/articles/admin-article-request"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!parseArticleId(id)) {
    return NextResponse.json({ error: "article id is invalid" }, { status: 400 })
  }

  const publishedAt = await parsePublishedAt(request)
  if (!publishedAt.ok) {
    return publishedAt.response
  }

  return proxyAuthenticatedRequest(request, `/api/admin/articles/${id}/published-at`, {
    service: "site",
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(publishedAt.value),
  })
}
