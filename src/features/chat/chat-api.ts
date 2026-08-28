import type { ChatRequest, ChatResponse } from "@/features/chat/types"

interface SendChatMessageOptions {
  idempotencyKey: string
  signal?: AbortSignal
}

export async function sendChatMessage(
  request: ChatRequest,
  { idempotencyKey, signal }: SendChatMessageOptions,
): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(request),
    signal,
  })

  const payload = (await response.json().catch(() => null)) as ChatResponse | { error?: string } | null

  if (!response.ok) {
    const message = payload && "error" in payload ? payload.error : undefined
    throw new Error(message || "The chat service is temporarily unavailable")
  }

  if (!payload || !("message" in payload) || typeof payload.message !== "string") {
    throw new Error("The chat service returned an invalid response")
  }

  return payload
}
