import { NextResponse } from "next/server"

import { createBackendChatHeaders, createChatBackendRequest } from "@/app/api/chat/forward"
import { clearAuthCookies } from "@/features/auth/session"

export async function POST(request: Request) {
  const prepared = await createChatBackendRequest(request)
  if ("error" in prepared) {
    return prepared.error
  }

  try {
    const response = await fetch(prepared.backendURL, {
      method: "POST",
      headers: createBackendChatHeaders(prepared.accessToken, prepared.idempotencyKey, {
        Accept: "text/event-stream",
      }),
      body: JSON.stringify(prepared.body),
      cache: "no-store",
      signal: request.signal,
    })

    if (response.status === 401) {
      await clearAuthCookies()
    }

    const contentType = response.headers.get("Content-Type") || ""
    if (!response.ok || !response.body || !contentType.includes("text/event-stream")) {
      const responseBody = await response.text()
      return new NextResponse(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": contentType || "application/json",
        },
      })
    }

    // Hand the backend stream straight back; aborting the client request cancels it upstream.
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    return NextResponse.json({ error: "Unable to connect to the Chat Agent backend" }, { status: 502 })
  }
}
