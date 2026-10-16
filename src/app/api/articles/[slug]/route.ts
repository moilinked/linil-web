import { NextResponse } from "next/server"

import { proxyPublicSiteRequest } from "@/app/api/backend"
import { noteSlugPattern } from "@/features/notes/types"

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  if (!noteSlugPattern.test(slug)) {
    return NextResponse.json({ error: "article not found" }, { status: 404 })
  }

  return proxyPublicSiteRequest(request, `/api/articles/${slug}`)
}
