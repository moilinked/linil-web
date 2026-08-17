import { NextResponse } from "next/server"

import type { ChatRequest } from "@/features/chat/types"

const maxMessageLength = 10_000

export async function POST(request: Request) {
  const apiBaseURL = process.env.CHAT_AGENT_API_URL
  if (!apiBaseURL) {
    return NextResponse.json({ error: "服务端缺少 CHAT_AGENT_API_URL 配置" }, { status: 500 })
  }

  const body = (await request.json().catch(() => null)) as Partial<ChatRequest> | null
  const sessionID = body?.session_id?.trim()
  const message = body?.message?.trim()

  if (!sessionID || !message) {
    return NextResponse.json({ error: "session_id 和 message 不能为空" }, { status: 400 })
  }
  if (message.length > maxMessageLength) {
    return NextResponse.json({ error: `message 不能超过 ${maxMessageLength} 个字符` }, { status: 400 })
  }

  let backendURL: URL
  try {
    backendURL = new URL("/api/chat", apiBaseURL)
  } catch {
    return NextResponse.json({ error: "CHAT_AGENT_API_URL 配置无效" }, { status: 500 })
  }

  try {
    const response = await fetch(backendURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionID, message } satisfies ChatRequest),
      cache: "no-store",
      signal: request.signal,
    })

    const responseBody = await response.text()
    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    })
  } catch {
    return NextResponse.json({ error: "无法连接 Chat Agent 后端" }, { status: 502 })
  }
}
