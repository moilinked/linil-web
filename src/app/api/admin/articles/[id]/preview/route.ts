import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { parseArticleId, parseArticlePreview } from "@/features/admin/articles/admin-article-request"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!parseArticleId(id)) {
    return NextResponse.json({ error: "article id is invalid" }, { status: 400 })
  }

  const preview = await parseArticlePreview(request)
  if (!preview.ok) {
    return preview.response
  }

  return proxyAuthenticatedRequest(request, `/api/admin/articles/${id}/preview`, {
    service: "site",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preview.value),
  })
}
