import type { ChatMessage } from "@/features/chat/types"

export type ChatPhase = "idle" | "hydrating" | "streaming" | "clearing"

export interface ChatState {
  requestId: number
  phase: ChatPhase
  conversationId: string | null
  title: string
  messages: ChatMessage[]
  streamingMessageId: string | null
  streamStatus: string
  error: string
}

export type ChatAction =
  | { type: "reset"; requestId: number }
  | { type: "hydrate:start"; requestId: number }
  | { type: "clear:start"; requestId: number }
  | { type: "send:start"; requestId: number; userMessage: ChatMessage; assistantMessage: ChatMessage }
  | { type: "conversation:loaded"; requestId: number; id: string; title: string; messages: ChatMessage[] }
  | { type: "conversation:empty"; requestId: number }
  | { type: "conversation:adopted"; requestId: number; id: string; fallbackTitle: string }
  | { type: "conversation:renamed"; requestId: number; title: string }
  | { type: "stream:text"; requestId: number; content: string }
  | { type: "stream:status"; requestId: number; status: string }
  | { type: "settled"; requestId: number }
  | { type: "aborted"; requestId: number }
  | { type: "failed"; requestId: number; error: string }

export const initialChatState: ChatState = {
  requestId: 0,
  phase: "idle",
  conversationId: null,
  title: "",
  messages: [],
  streamingMessageId: null,
  streamStatus: "",
  error: "",
}

export function createInitialChatState(isAuthenticated: boolean): ChatState {
  return isAuthenticated ? { ...initialChatState, phase: "hydrating" } : initialChatState
}

// Drops the placeholder when the assistant never produced anything, so an aborted or failed
// turn does not leave an empty bubble behind.
function withoutEmptyPlaceholder(state: ChatState): ChatMessage[] {
  const streaming = state.messages.find((message) => message.id === state.streamingMessageId)
  if (!streaming || streaming.content) {
    return state.messages
  }

  return state.messages.filter((message) => message.id !== state.streamingMessageId)
}

function settle(state: ChatState, messages: ChatMessage[], error: string): ChatState {
  return { ...state, phase: "idle", messages, streamingMessageId: null, streamStatus: "", error }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  // Starting a request always wins and claims the requestId.
  switch (action.type) {
    case "reset":
      return { ...initialChatState, requestId: action.requestId }
    case "hydrate:start":
      return { ...state, requestId: action.requestId, phase: "hydrating", streamingMessageId: null, error: "" }
    case "clear:start":
      return { ...state, requestId: action.requestId, phase: "clearing", streamingMessageId: null, error: "" }
    case "send:start":
      return {
        ...state,
        requestId: action.requestId,
        phase: "streaming",
        messages: [...state.messages, action.userMessage, action.assistantMessage],
        streamingMessageId: action.assistantMessage.id,
        streamStatus: "",
        error: "",
      }
    default:
      break
  }

  // Everything else belongs to a request that may already have been superseded.
  if (action.requestId !== state.requestId) {
    return state
  }

  switch (action.type) {
    case "conversation:loaded":
      return {
        ...state,
        phase: "idle",
        conversationId: action.id,
        title: action.title,
        messages: action.messages,
        streamingMessageId: null,
        streamStatus: "",
      }
    case "conversation:empty":
      return { ...initialChatState, requestId: state.requestId }
    case "conversation:adopted":
      return { ...state, conversationId: action.id, title: state.title || action.fallbackTitle }
    case "conversation:renamed":
      return { ...state, title: action.title }
    case "stream:text":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === state.streamingMessageId ? { ...message, content: action.content } : message,
        ),
      }
    case "stream:status":
      return { ...state, streamStatus: action.status }
    case "settled":
      return settle(state, state.messages, "")
    case "aborted":
      return settle(state, withoutEmptyPlaceholder(state), "")
    case "failed":
      return settle(state, withoutEmptyPlaceholder(state), action.error)
    default:
      return state
  }
}
