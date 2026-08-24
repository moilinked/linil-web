"use client"

import { type KeyboardEvent, type SubmitEvent, useRef, useState } from "react"
import { ArrowDownIcon, Bot, LoaderCircle, SendHorizontal, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/auth-context"
import { sendChatMessage } from "@/features/chat/chat-api"
import type { ChatMessage } from "@/features/chat/types"
import { cn } from "@/lib/utils"

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "发送消息开始对话",
  },
]

export function ChatPanel() {
  const { isAuthenticated, openLogin } = useAuth()
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const sessionIdRef = useRef<string | null>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isAuthenticated) {
      openLogin()
      return
    }

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
    if (!isAuthenticated) {
      return
    }

    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3 sm:px-5">
        <h1 className="font-semibold">Chat Agent</h1>
      </div>

      <MessageScrollerProvider autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport aria-label="对话记录">
            <MessageScrollerContent
              aria-busy={isSending}
              className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6"
            >
              {messages.map((message) => {
                const isUser = message.role === "user"

                return (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={isUser}
                  >
                    <article className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
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
                  </MessageScrollerItem>
                )
              })}

              {isSending ? (
                <MessageScrollerItem messageId="thinking">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    正在思考…
                  </div>
                </MessageScrollerItem>
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton>
            <ArrowDownIcon aria-hidden="true" />
            <span className="sr-only">跳到最新消息</span>
          </MessageScrollerButton>
        </MessageScroller>
      </MessageScrollerProvider>

      <form onSubmit={handleSubmit} className="border-t bg-background p-3 sm:p-4">
        <div className="mx-auto w-full max-w-3xl">
          <div
            className={cn(
              "flex items-end gap-2 rounded-xl border bg-background p-2 shadow-xs focus-within:ring-2 focus-within:ring-ring/30",
              !isAuthenticated && "cursor-pointer",
            )}
            onClick={isAuthenticated ? undefined : openLogin}
          >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAuthenticated ? "输入消息，Enter 发送，Shift + Enter 换行" : "登录后即可开始对话"}
              aria-label="聊天消息"
              rows={1}
              className="max-h-40 min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              disabled={!isAuthenticated || isSending}
            />
            {isAuthenticated ? (
              <Button type="submit" size="icon" aria-label="发送消息" disabled={!input.trim() || isSending}>
                {isSending ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <SendHorizontal aria-hidden="true" />
                )}
              </Button>
            ) : (
              <Button type="button" onClick={openLogin}>
                登录
              </Button>
            )}
          </div>
          <p className="mt-2 min-h-5 text-xs text-destructive" role="alert">
            {error}
          </p>
        </div>
      </form>
    </section>
  )
}
