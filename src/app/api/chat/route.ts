import { NextResponse } from "next/server"

import { createBackendChatHeaders, createChatBackendRequest } from "@/app/api/chat/forward"

export async function POST(request: Request) {
  const prepared = await createChatBackendRequest(request, "/api/chat")
  if ("error" in prepared) {
    return prepared.error
  }

  try {
    const response = await fetch(prepared.backendURL, {
      method: "POST",
      headers: createBackendChatHeaders(prepared.accessToken, prepared.idempotencyKey),
      body: JSON.stringify(prepared.body),
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
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    return NextResponse.json({ error: "Unable to connect to the Chat Agent backend" }, { status: 502 })
  }
}
