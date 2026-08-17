"use client"

import { type FormEvent, type KeyboardEvent, useRef, useState } from "react"
import { Bot, LoaderCircle, SendHorizontal, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { sendChatMessage } from "@/features/chat/chat-api"
import type { ChatMessage } from "@/features/chat/types"
import { cn } from "@/lib/utils"

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "你好，我是你的 Chat Agent。后端 Chat API 完成后，可以从这里开始对话。",
  },
]

export function ChatPanel() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const sessionIdRef = useRef<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const content = input.trim()
    if (!content || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setError("")
    setIsSending(true)

    try {
      sessionIdRef.current ??= crypto.randomUUID()
      const response = await sendChatMessage({
        session_id: sessionIdRef.current,
        message: content,
      })

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
        },
      ])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "发送消息失败")
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3 sm:px-5">
        <h1 className="font-semibold">Chat Agent</h1>
        <p className="text-sm text-muted-foreground">当前通过 Next.js API 代理连接 Go 服务</p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
          {messages.map((message) => {
            const isUser = message.role === "user"

            return (
              <article
                key={message.id}
                className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {isUser ? <User aria-hidden="true" className="size-4" /> : <Bot aria-hidden="true" className="size-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 whitespace-pre-wrap",
                    isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {message.content}
                </div>
              </article>
            )
          })}

          {isSending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              正在思考…
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t bg-background p-3 sm:p-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-xs focus-within:ring-2 focus-within:ring-ring/30">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送，Shift + Enter 换行"
              aria-label="聊天消息"
              rows={1}
              className="max-h-40 min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              disabled={isSending}
            />
            <Button type="submit" size="icon" aria-label="发送消息" disabled={!input.trim() || isSending}>
              {isSending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <SendHorizontal aria-hidden="true" />
              )}
            </Button>
          </div>
          <p className="mt-2 min-h-5 text-xs text-destructive" role="alert">
            {error}
          </p>
        </div>
      </form>
    </section>
  )
}
