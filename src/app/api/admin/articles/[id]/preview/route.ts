import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { parseArticleId, parseArticlePreview } from "@/features/admin/articles/admin-article-request"
import { highlightNoteHtml } from "@/features/notes/highlight-note"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!parseArticleId(id)) {
    return NextResponse.json({ error: "article id is invalid" }, { status: 400 })
  }

  const preview = await parseArticlePreview(request)
  if (!preview.ok) {
    return preview.response
  }

  const response = await proxyAuthenticatedRequest(request, `/api/admin/articles/${id}/preview`, {
    service: "site",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preview.value),
  })
  if (!response.ok) {
    return response
  }

  const payload = (await response.json().catch(() => null)) as { html?: unknown } | null
  if (!payload || typeof payload.html !== "string") {
    return NextResponse.json({ error: "The article service returned an invalid response" }, { status: 502 })
  }

  return NextResponse.json({
    ...payload,
    html: await highlightNoteHtml(payload.html),
  })
}
