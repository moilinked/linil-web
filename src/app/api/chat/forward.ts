import { NextResponse } from "next/server"

import { resolveBackendUrl } from "@/app/api/backend"
import { requireAccessToken } from "@/features/auth/session"
import { isValidConversationId, isValidIdempotencyKey, type ChatRequest } from "@/features/chat/types"

const maxMessageLength = 10_000

export type ChatBackendRequest =
  | {
      error: Response
    }
  | {
      backendURL: URL
      accessToken: string
      idempotencyKey: string
      body: ChatRequest
    }

export async function createChatBackendRequest(
  request: Request,
  pathname: "/api/chat/stream",
): Promise<ChatBackendRequest> {
  const access = await requireAccessToken()
  if (!access.ok) {
    return { error: access.response }
  }
  const accessToken = access.token

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim()
  if (!idempotencyKey) {
    return { error: NextResponse.json({ error: "Idempotency-Key is required" }, { status: 400 }) }
  }
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return { error: NextResponse.json({ error: "Idempotency-Key is invalid" }, { status: 400 }) }
  }

  const body = (await request.json().catch(() => null)) as Partial<ChatRequest> | null
  const conversationID = body?.conversation_id?.trim()
  const message = body?.message?.trim()

  if (!message) {
    return { error: NextResponse.json({ error: "message is required" }, { status: 400 }) }
  }
  if (conversationID && !isValidConversationId(conversationID)) {
    return { error: NextResponse.json({ error: "conversation_id is invalid" }, { status: 400 }) }
  }
  if (message.length > maxMessageLength) {
    return {
      error: NextResponse.json({ error: `message cannot exceed ${maxMessageLength} characters` }, { status: 400 }),
    }
  }

  const resolved = resolveBackendUrl("chat", pathname)
  if (!resolved.ok) {
    return { error: resolved.error }
  }
  const backendURL = resolved.url

  if (process.env.NODE_ENV === "development") {
    console.info("[chat] Authorization", {
      path: pathname,
      present: true,
      tokenLength: accessToken.length,
      tokenPreview: `${accessToken.slice(0, 8)}…`,
    })
  }

  return {
    backendURL,
    accessToken,
    idempotencyKey,
    body: conversationID ? { conversation_id: conversationID, message } : { message },
  }
}

export function createBackendChatHeaders(accessToken: string, idempotencyKey: string, extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Idempotency-Key": idempotencyKey,
    ...extra,
  }
}
