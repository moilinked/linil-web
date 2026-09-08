export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  status?: string
}

export interface ChatRequest {
  session_id: string
  message: string
}

export interface ChatResponse {
  message: string
}
