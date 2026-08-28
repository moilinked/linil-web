import { NextResponse } from "next/server"

import { getApiUrl } from "@/config/api"
import { getAccessToken } from "@/features/auth/session"
import type { ChatRequest } from "@/features/chat/types"

const maxMessageLength = 10_000

export async function POST(request: Request) {
  const apiBaseURL = getApiUrl()
  if (!apiBaseURL) {
    return NextResponse.json({ error: "The server is missing the API_URL configuration" }, { status: 500 })
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: "A valid Bearer token is required" }, { status: 401 })
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim()
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key is required" }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as Partial<ChatRequest> | null
  const sessionID = body?.session_id?.trim()
  const message = body?.message?.trim()

  if (!sessionID || !message) {
    return NextResponse.json({ error: "session_id and message are required" }, { status: 400 })
  }
  if (message.length > maxMessageLength) {
    return NextResponse.json(
      { error: `message cannot exceed ${maxMessageLength} characters` },
      { status: 400 },
    )
  }

  let backendURL: URL
  try {
    backendURL = new URL("/api/chat", apiBaseURL)
  } catch {
    return NextResponse.json({ error: "The API_URL configuration is invalid" }, { status: 500 })
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[chat] Authorization", {
      present: true,
      tokenLength: accessToken.length,
      tokenPreview: `${accessToken.slice(0, 8)}…`,
    })
  }

  try {
    const response = await fetch(backendURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Idempotency-Key": idempotencyKey,
      },

      body: JSON.stringify({ session_id: sessionID, message } satisfies ChatRequest),
      cache: "no-store",
      signal: request.signal,
    })

    const responseBody = await response.text()
    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    })
  } catch {
    return NextResponse.json({ error: "Unable to connect to the Chat Agent backend" }, { status: 502 })
  }
}
