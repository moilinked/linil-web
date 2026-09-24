import { notifyIfUnauthorized } from "@/features/auth/session-expiry"
import { applyChatStreamEvent } from "@/features/chat/parse-stream-event"
import type { ChatRequest } from "@/features/chat/types"

interface StreamChatMessageOptions {
  idempotencyKey: string
  signal?: AbortSignal
  onText: (content: string) => void
  onStatus?: (status: string) => void
  onConversationId?: (conversationId: string) => void
}

function consumeSse(buffer: string, onEvent: (eventName: string, data: string) => void) {
  const parts = buffer.split("\n\n")
  const rest = parts.pop() ?? ""

  for (const block of parts) {
    let eventName = ""
    const dataLines: string[] = []

    for (const rawLine of block.split("\n")) {
      const line = rawLine.replace(/\r$/, "")
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim()
        continue
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart())
      }
    }

    if (dataLines.length > 0) {
      onEvent(eventName, dataLines.join("\n"))
    }
  }

  return rest
}

function getErrorMessage(payload: { error?: string } | null, fallback: string) {
  return payload && payload.error ? payload.error : fallback
}

// A single chunk can carry many events; coalesce them so React renders at most once per frame.
function batchByFrame(onText: (content: string) => void) {
  let pending: string | null = null
  let frame = 0

  function flush() {
    frame = 0
    if (pending === null) {
      return
    }

    const content = pending
    pending = null
    onText(content)
  }

  return {
    push(content: string) {
      pending = content
      if (!frame) {
        frame = requestAnimationFrame(flush)
      }
    },
    flush() {
      if (frame) {
        cancelAnimationFrame(frame)
      }
      flush()
    },
  }
}

export async function streamChatMessage(
  request: ChatRequest,
  { idempotencyKey, signal, onText, onStatus, onConversationId }: StreamChatMessageOptions,
) {
  const body: ChatRequest = request.conversation_id
    ? { conversation_id: request.conversation_id, message: request.message }
    : { message: request.message }

  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    notifyIfUnauthorized(response.status)
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(getErrorMessage(payload, "The chat service is temporarily unavailable"))
  }

  if (!response.body) {
    throw new Error("The chat service returned an empty stream")
  }

  const contentType = response.headers.get("Content-Type") || ""
  if (!contentType.includes("text/event-stream")) {
    const payload = (await response.json().catch(() => null)) as {
      conversation_id?: string
      message?: string
      error?: string
    } | null
    if (payload && typeof payload.message === "string") {
      onText(payload.message)
      if (typeof payload.conversation_id === "string" && payload.conversation_id) {
        onConversationId?.(payload.conversation_id)
      }
      return
    }

    throw new Error(getErrorMessage(payload, "The chat service returned an invalid response"))
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const text = batchByFrame(onText)
  let buffer = ""
  let content = ""
  let streamError = ""

  const applyEvent = (eventName: string, data: string) => {
    const next = applyChatStreamEvent(eventName, data, content)

    if (next.status) {
      onStatus?.(next.status)
    }

    if (next.conversationId) {
      onConversationId?.(next.conversationId)
    }

    if (next.content !== content) {
      content = next.content
      text.push(content)
    }

    if (next.error) {
      streamError = next.error
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      buffer = consumeSse(buffer, applyEvent)

      if (streamError) {
        await reader.cancel().catch(() => undefined)
        throw new Error(streamError)
      }
    }

    const remaining = decoder.decode()
    if (remaining || buffer.trim()) {
      consumeSse(`${buffer}${remaining}\n\n`, applyEvent)
    }

    if (streamError) {
      throw new Error(streamError)
    }
  } finally {
    text.flush()
  }
}
