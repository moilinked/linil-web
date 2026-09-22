import { notifyIfUnauthorized } from "@/features/auth/session-expiry"
import type { ChatMessage, ConversationDetail, ConversationSummary } from "@/features/chat/types"

function getErrorMessage(payload: { error?: string } | null, fallback: string) {
  return payload && payload.error ? payload.error : fallback
}

async function readError(response: Response, fallback: string) {
  notifyIfUnauthorized(response.status)
  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  throw new Error(getErrorMessage(payload, fallback))
}

export async function listConversations(signal?: AbortSignal) {
  const response = await fetch("/api/conversations", {
    method: "GET",
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    await readError(response, "Failed to load conversations")
  }

  const payload = (await response.json().catch(() => null)) as { conversations?: ConversationSummary[] } | null
  const conversations = Array.isArray(payload?.conversations) ? payload.conversations : []

  return conversations.slice().sort((left, right) => {
    const delta = Date.parse(right.updated_at) - Date.parse(left.updated_at)
    return Number.isFinite(delta) ? delta : 0
  })
}

export async function getConversation(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "GET",
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    await readError(response, "Failed to load conversation")
  }

  const payload = (await response.json().catch(() => null)) as ConversationDetail | null
  if (!payload || typeof payload.id !== "string") {
    throw new Error("The conversation service returned an invalid response")
  }

  return payload
}

export async function clearConversationMessages(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: "DELETE",
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    await readError(response, "Failed to clear conversation")
  }

  const payload = (await response.json().catch(() => null)) as ConversationDetail | null
  if (!payload || typeof payload.id !== "string") {
    throw new Error("The conversation service returned an invalid response")
  }

  return payload
}

export async function updateConversationTitle(id: string, title: string, signal?: AbortSignal) {
  const response = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
    signal,
  })

  if (!response.ok) {
    await readError(response, "Failed to rename conversation")
  }

  const payload = (await response.json().catch(() => null)) as ConversationSummary | null
  if (!payload || typeof payload.id !== "string" || typeof payload.title !== "string") {
    throw new Error("The conversation service returned an invalid response")
  }

  return payload
}

export function toChatMessages(conversationId: string, items: ConversationDetail["messages"] | undefined) {
  if (!items) {
    return []
  }

  const messages: ChatMessage[] = []

  for (const [index, item] of items.entries()) {
    if (item.role !== "user" && item.role !== "assistant") {
      continue
    }
    if (item.tool_calls) {
      continue
    }

    const content = typeof item.content === "string" ? item.content : ""
    if (!content.trim()) {
      continue
    }

    messages.push({
      id: `${conversationId}:${index}`,
      role: item.role,
      content,
    })
  }

  return messages
}
