import type { ChatRequest, ChatResponse } from "@/features/chat/types"

export async function sendChatMessage(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  })

  const payload = (await response.json().catch(() => null)) as ChatResponse | { error?: string } | null

  if (!response.ok) {
    const message = payload && "error" in payload ? payload.error : undefined
    throw new Error(message || "Chat 服务暂时不可用")
  }

  if (!payload || !("message" in payload) || typeof payload.message !== "string") {
    throw new Error("Chat 服务返回了无效响应")
  }

  return payload
}
