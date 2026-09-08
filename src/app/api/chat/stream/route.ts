import { NextResponse } from "next/server"

import { createBackendChatHeaders, createChatBackendRequest } from "@/app/api/chat/forward"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function pipeSse(body: ReadableStream<Uint8Array>, signal: AbortSignal) {
  const reader = body.getReader()
  const cancelBackend = () => {
    void reader.cancel().catch(() => undefined)
  }

  signal.addEventListener("abort", cancelBackend, { once: true })

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (signal.aborted) {
        cancelBackend()
        controller.close()
        return
      }

      try {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }

        controller.enqueue(value)
      } catch (error) {
        cancelBackend()
        controller.error(error)
      }
    },
    cancel() {
      cancelBackend()
    },
  })
}

export async function POST(request: Request) {
  const prepared = await createChatBackendRequest(request, "/api/chat/stream")
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

    const contentType = response.headers.get("Content-Type") || ""
    if (!response.ok || !response.body || !contentType.includes("text/event-stream")) {
      const responseBody = await response.text()
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": contentType || "application/json",
        },
      })
    }

    return new Response(pipeSse(response.body, request.signal), {
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
