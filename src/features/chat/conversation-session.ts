let currentSessionId: string | null = null

export function getChatSessionId() {
  currentSessionId ??= crypto.randomUUID()
  return currentSessionId
}

export function startNewChatSession() {
  currentSessionId = crypto.randomUUID()
  return currentSessionId
}
