export type ChatStreamKind = "delta" | "done" | "tool_call" | "tool_result" | "reasoning" | "error" | "ignored"

export interface ChatStreamUpdate {
  kind: ChatStreamKind
  content: string
  status?: string
  error?: string
  done: boolean
}

function readString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function normalizeKind(value: string) {
  const name = value.trim().toLowerCase().replace(/[\s-]+/g, "_")

  if (name === "delta" || name === "text" || name === "text_delta" || name === "content_block_delta" || name === "message") {
    return "delta"
  }
  if (name === "done" || name === "complete" || name === "end" || name === "finished") {
    return "done"
  }
  if (name === "tool_call" || name === "toolcall" || name === "function_call" || name === "tool") {
    return "tool_call"
  }
  if (name === "tool_result" || name === "toolresult" || name === "function_result" || name === "tool_response") {
    return "tool_result"
  }
  if (name === "reasoning" || name === "thinking" || name === "thought") {
    return "reasoning"
  }
  if (name === "error") {
    return "error"
  }

  return ""
}

function payloadKind(payload: Record<string, unknown>) {
  return normalizeKind(readString(payload.type) || readString(payload.event) || readString(payload.kind))
}

function readDeltaText(payload: Record<string, unknown>) {
  const nested = payload.choices
  if (Array.isArray(nested)) {
    const choice = asRecord(nested[0])
    const delta = asRecord(choice?.delta)
    const nestedText = readString(delta?.content) || readString(delta?.text)
    if (nestedText) {
      return nestedText
    }
  }

  const delta = payload.delta
  if (typeof delta === "string") {
    return delta
  }

  const deltaRecord = asRecord(delta)
  if (deltaRecord) {
    return readString(deltaRecord.content) || readString(deltaRecord.text)
  }

  return readString(payload.content) || readString(payload.text) || readString(payload.token)
}

function readDoneText(payload: Record<string, unknown>) {
  const nested = payload.choices
  if (Array.isArray(nested)) {
    const choice = asRecord(nested[0])
    const message = asRecord(choice?.message)
    const nestedText = readString(message?.content) || readString(choice?.text)
    if (nestedText) {
      return nestedText
    }
  }

  const message = payload.message
  if (typeof message === "string") {
    return message
  }

  const messageRecord = asRecord(message)
  if (messageRecord) {
    return readString(messageRecord.content) || readString(messageRecord.text)
  }

  return readString(payload.content) || readString(payload.text)
}

function readToolName(payload: Record<string, unknown>) {
  const fn = asRecord(payload.function)
  const toolCall = asRecord(payload.tool_call)

  return (
    readString(payload.name) ||
    readString(payload.tool) ||
    readString(payload.tool_name) ||
    readString(fn?.name) ||
    readString(toolCall?.name)
  )
}

function statusForTool(name: string) {
  const key = name.toLowerCase()

  if (key.includes("weather")) {
    return "Looking up the weather…"
  }
  if (key.includes("search") || key.includes("web")) {
    return "Searching the web…"
  }
  if (name) {
    return `Using ${name}…`
  }

  return "Using a tool…"
}

function looksLikeJsonObject(value: string) {
  const trimmed = value.trim()
  return trimmed.startsWith("{") && trimmed.endsWith("}")
}

function inferKind(eventName: string, parsed: Record<string, unknown> | null, trimmed: string): ChatStreamKind | "" {
  const named = normalizeKind(eventName)
  if (named) {
    return named
  }

  if (!parsed) {
    return trimmed ? "delta" : ""
  }

  const typed = payloadKind(parsed)
  if (typed) {
    return typed
  }

  if (readToolName(parsed) && (parsed.arguments !== undefined || parsed.parameters !== undefined || parsed.input !== undefined)) {
    return "tool_call"
  }

  const delta = readDeltaText(parsed)
  if (delta && !looksLikeJsonObject(delta)) {
    return "delta"
  }

  return "ignored"
}

export function applyChatStreamEvent(eventName: string, data: string, current: string): ChatStreamUpdate {
  const trimmed = data.trim()

  if (trimmed === "[DONE]") {
    return { kind: "done", content: current, done: true }
  }

  if (trimmed.startsWith("[")) {
    return { kind: "ignored", content: current, done: false }
  }

  let parsed: Record<string, unknown> | null = null
  if (trimmed.startsWith("{")) {
    try {
      parsed = asRecord(JSON.parse(data) as unknown)
    } catch {
      parsed = null
    }
  }

  if (trimmed.startsWith("{") && !parsed) {
    return { kind: "ignored", content: current, done: false }
  }

  const kind = inferKind(eventName, parsed, trimmed)

  if (kind === "reasoning" || kind === "tool_result" || kind === "ignored" || !kind) {
    return { kind: kind || "ignored", content: current, done: false }
  }

  if (kind === "tool_call") {
    return {
      kind: "tool_call",
      content: current,
      status: statusForTool(parsed ? readToolName(parsed) : ""),
      done: false,
    }
  }

  if (kind === "error") {
    const error = parsed ? readString(parsed.error) || readString(parsed.message) || trimmed : trimmed
    return { kind: "error", content: current, done: true, error: error || "Stream error" }
  }

  if (kind === "done") {
    const snapshot = parsed ? readDoneText(parsed) : ""
    const next = snapshot && !looksLikeJsonObject(snapshot) ? snapshot : current
    return { kind: "done", content: next, done: true }
  }

  const delta = parsed ? readDeltaText(parsed) : trimmed
  if (delta && !looksLikeJsonObject(delta)) {
    return { kind: "delta", content: current + delta, done: false }
  }

  return { kind: "delta", content: current, done: false }
}
