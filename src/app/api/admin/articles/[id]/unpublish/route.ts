import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { parseArticleId } from "@/features/admin/articles/admin-article-request"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!parseArticleId(id)) {
    return NextResponse.json({ error: "article id is invalid" }, { status: 400 })
  }

  return proxyAuthenticatedRequest(request, `/api/admin/articles/${id}/unpublish`, {
    service: "site",
    method: "POST",
  })
}
