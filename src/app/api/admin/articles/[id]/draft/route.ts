import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { parseArticleDraft, parseArticleId } from "@/features/admin/articles/admin-article-request"

async function articleId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!parseArticleId(id)) {
    return NextResponse.json({ error: "article id is invalid" }, { status: 400 })
  }

  return id
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const id = await articleId(context)
  if (id instanceof NextResponse) {
    return id
  }

  const draft = await parseArticleDraft(request)
  if (!draft.ok) {
    return draft.response
  }

  return proxyAuthenticatedRequest(request, `/api/admin/articles/${id}/draft`, {
    service: "site",
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft.value),
  })
}
