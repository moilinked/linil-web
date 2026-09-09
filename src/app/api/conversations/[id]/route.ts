import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { conversationTitleMaxLength, isValidConversationId, normalizeConversationTitle } from "@/features/chat/types"

export const dynamic = "force-dynamic"

async function conversationParams(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!isValidConversationId(id)) {
    return { error: NextResponse.json({ error: "conversation_id is invalid" }, { status: 400 }) }
  }

  return { id }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = await conversationParams(context)
  if ("error" in parsed) {
    return parsed.error
  }

  return proxyAuthenticatedRequest(request, `/api/conversations/${encodeURIComponent(parsed.id)}`)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = await conversationParams(context)
  if ("error" in parsed) {
    return parsed.error
  }

  const payload = (await request.json().catch(() => null)) as { title?: unknown } | null
  if (!payload || typeof payload.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  const title = normalizeConversationTitle(payload.title)
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }
  if ([...title].length > conversationTitleMaxLength) {
    return NextResponse.json({ error: "title is too long" }, { status: 400 })
  }

  return proxyAuthenticatedRequest(request, `/api/conversations/${encodeURIComponent(parsed.id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  })
}
