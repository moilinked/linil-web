export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  status?: string
}

export interface ChatRequest {
  conversation_id?: string
  message: string
}

export interface ChatResponse {
  conversation_id: string
  message: string
}

export interface ConversationSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  role: string
  content?: string
  name?: string
  tool_call_id?: string
  tool_calls?: unknown
  reasoning_content?: string
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[]
}

export const conversationTitleMaxLength = 40

export function normalizeConversationTitle(title: string) {
  return title.replace(/\s+/g, " ").trim()
}

export const conversationIdPattern = /^[A-Za-z0-9._-]{1,128}$/

export function isValidConversationId(value: string) {
  return conversationIdPattern.test(value)
}

export function isValidIdempotencyKey(value: string) {
  return conversationIdPattern.test(value)
}
