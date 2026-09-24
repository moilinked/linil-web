"use client"

import { memo } from "react"
import { LoaderCircle } from "lucide-react"

import { MessageScrollerItem } from "@/components/ui/message-scroller"
import { ChatMarkdown } from "@/features/chat/components/chat-markdown"
import type { ChatMessage } from "@/features/chat/types"
import { cn } from "@/lib/utils"

interface ChatMessageRowProps {
  message: ChatMessage
  isStreaming?: boolean
  status?: string
}

// Only the streaming row receives changing props, so the rest of the transcript stays mounted as-is.
export const ChatMessageRow = memo(function ChatMessageRow({ message, isStreaming, status }: ChatMessageRowProps) {
  const isUser = message.role === "user"
  const isWaiting = !isUser && isStreaming && !message.content

  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor={isUser}>
      <article className={cn("flex items-start", isUser && "justify-end")}>
        {isUser ? (
          <div className="max-w-[85%] rounded-[20px] bg-primary px-4 py-2.5 text-sm leading-6 whitespace-pre-wrap text-primary-foreground">
            {message.content}
          </div>
        ) : (
          <div className="flex max-w-[85%] flex-col gap-2">
            {isWaiting ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                {status || "Thinking…"}
              </div>
            ) : null}
            {message.content ? <ChatMarkdown content={message.content} className="text-foreground" /> : null}
          </div>
        )}
      </article>
    </MessageScrollerItem>
  )
})
