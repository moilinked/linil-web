import { NextResponse } from "next/server"

import { getApiUrl } from "@/config/api"
import { getAccessToken } from "@/features/auth/session"
import type { ChatRequest } from "@/features/chat/types"

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

export async function createChatBackendRequest(request: Request, pathname: "/api/chat" | "/api/chat/stream"): Promise<ChatBackendRequest> {
  const apiBaseURL = getApiUrl()
  if (!apiBaseURL) {
    return { error: NextResponse.json({ error: "The server is missing the API_URL configuration" }, { status: 500 }) }
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return { error: NextResponse.json({ error: "A valid Bearer token is required" }, { status: 401 }) }
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim()
  if (!idempotencyKey) {
    return { error: NextResponse.json({ error: "Idempotency-Key is required" }, { status: 400 }) }
  }

  const body = (await request.json().catch(() => null)) as Partial<ChatRequest> | null
  const sessionID = body?.session_id?.trim()
  const message = body?.message?.trim()

  if (!sessionID || !message) {
    return { error: NextResponse.json({ error: "session_id and message are required" }, { status: 400 }) }
  }
  if (message.length > maxMessageLength) {
    return {
      error: NextResponse.json({ error: `message cannot exceed ${maxMessageLength} characters` }, { status: 400 }),
    }
  }

  let backendURL: URL
  try {
    backendURL = new URL(pathname, apiBaseURL)
  } catch {
    return { error: NextResponse.json({ error: "The API_URL configuration is invalid" }, { status: 500 }) }
  }

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
    body: { session_id: sessionID, message },
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
