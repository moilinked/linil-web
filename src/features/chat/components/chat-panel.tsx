"use client"

import { type KeyboardEvent, type SubmitEvent, useEffect, useRef, useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Eraser,
  GlobeIcon,
  ImageIcon,
  LoaderCircle,
  MessageSquareDashed,
  PaperclipIcon,
  PlusIcon,
  Square,
  TelescopeIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { streamChatMessage } from "@/features/chat/chat-api"
import { CHAT_RELOAD_EVENT } from "@/features/chat/chat-reload"
import { ChatMarkdown } from "@/features/chat/components/chat-markdown"
import { ConversationTitle } from "@/features/chat/components/conversation-title"
import {
  clearConversationMessages,
  getConversation,
  listConversations,
  toChatMessages,
  updateConversationTitle,
} from "@/features/chat/conversation-api"
import type { ChatMessage } from "@/features/chat/types"
import { cn } from "@/lib/utils"

function ChatEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <MessageSquareDashed aria-hidden="true" className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "Morning"
  }

  if (hour < 18) {
    return "Afternoon"
  }

  return "Evening"
}

export function ChatPanel() {
  const { isAuthenticated, user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState("")
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isHydrating, setIsHydrating] = useState(isAuthenticated)
  const [isClearing, setIsClearing] = useState(false)
  const [isClearOpen, setIsClearOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const mutationEpochRef = useRef(0)

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    if (!isAuthenticated) {
      abortRef.current?.abort()
      abortRef.current = null
      return
    }

    const controller = new AbortController()

    async function loadLatestConversation() {
      abortRef.current?.abort()
      abortRef.current = null
      setIsSending(false)
      setIsHydrating(true)
      setError("")

      try {
        const conversations = await listConversations(controller.signal)
        if (controller.signal.aborted) {
          return
        }

        const latest = conversations[0]
        if (!latest) {
          conversationIdRef.current = null
          setConversationId(null)
          setConversationTitle("")
          setMessages([])
          return
        }

        const detail = await getConversation(latest.id, controller.signal)
        if (controller.signal.aborted) {
          return
        }

        conversationIdRef.current = detail.id
        setConversationId(detail.id)
        setConversationTitle(detail.title)
        setMessages(toChatMessages(detail.id, detail.messages))
      } catch (requestError) {
        if (controller.signal.aborted) {
          return
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load conversation")
      } finally {
        if (!controller.signal.aborted) {
          setIsHydrating(false)
        }
      }
    }

    void loadLatestConversation()

    return () => {
      controller.abort()
      abortRef.current?.abort()
    }
  }, [isAuthenticated, reloadToken])

  useEffect(() => {
    function handleReload() {
      abortRef.current?.abort()
      abortRef.current = null
      setReloadToken((current) => current + 1)
    }

    window.addEventListener(CHAT_RELOAD_EVENT, handleReload)
    return () => {
      window.removeEventListener(CHAT_RELOAD_EVENT, handleReload)
    }
  }, [])

  function handleStopStreaming() {
    abortRef.current?.abort()
  }

  async function handleRename(nextTitle: string) {
    const id = conversationIdRef.current
    if (!id) {
      return
    }

    const summary = await updateConversationTitle(id, nextTitle)
    setConversationTitle(summary.title)
  }

  async function handleClearConversation() {
    const id = conversationIdRef.current
    if (!id || isClearing) {
      return
    }

    mutationEpochRef.current += 1
    const epoch = mutationEpochRef.current
    abortRef.current?.abort()
    abortRef.current = null
    setIsSending(false)
    setIsClearing(true)
    setError("")

    try {
      const detail = await clearConversationMessages(id)
      if (mutationEpochRef.current !== epoch) {
        return
      }

      conversationIdRef.current = detail.id
      setConversationId(detail.id)
      setConversationTitle(detail.title)
      setMessages(toChatMessages(detail.id, detail.messages))
      setIsClearOpen(false)
    } catch (requestError) {
      if (mutationEpochRef.current !== epoch) {
        return
      }

      setError(requestError instanceof Error ? requestError.message : "Failed to clear conversation")
    } finally {
      if (mutationEpochRef.current === epoch) {
        setIsClearing(false)
      }
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isAuthenticated || isHydrating || isClearing) {
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

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    }
    const submitEpoch = mutationEpochRef.current

    setMessages((current) => [...current, userMessage, assistantMessage])
    setInput("")
    setError("")
    setIsSending(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChatMessage(
        {
          ...(conversationIdRef.current ? { conversation_id: conversationIdRef.current } : {}),
          message: content,
        },
        {
          idempotencyKey: userMessage.id,
          signal: controller.signal,
          onText(nextContent) {
            if (mutationEpochRef.current !== submitEpoch) {
              return
            }

            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: nextContent, status: nextContent ? undefined : message.status }
                  : message,
              ),
            )
          },
          onStatus(status) {
            if (mutationEpochRef.current !== submitEpoch) {
              return
            }

            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id && !message.content ? { ...message, status } : message,
              ),
            )
          },
          onConversationId(nextConversationId) {
            if (mutationEpochRef.current !== submitEpoch) {
              return
            }

            conversationIdRef.current = nextConversationId
            setConversationId(nextConversationId)
            setConversationTitle((current) => current || content.slice(0, 40))
          },
        },
      )
    } catch (requestError) {
      if (mutationEpochRef.current !== submitEpoch) {
        return
      }

      if (controller.signal.aborted) {
        setMessages((current) => {
          const assistant = current.find((message) => message.id === assistantMessage.id)
          if (assistant?.content) {
            return current
          }

          return current.filter((message) => message.id !== assistantMessage.id)
        })
        return
      }

      setError(requestError instanceof Error ? requestError.message : "Failed to send message")
      setMessages((current) => {
        const assistant = current.find((message) => message.id === assistantMessage.id)
        if (assistant?.content) {
          return current
        }

        return current.filter((message) => message.id !== assistantMessage.id)
      })
    } finally {
      if (mutationEpochRef.current !== submitEpoch) {
        return
      }

      if (abortRef.current === controller) {
        abortRef.current = null
        setIsSending(false)
        setMessages((current) =>
          current.map((message) => (message.id === assistantMessage.id ? { ...message, status: undefined } : message)),
        )
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!isAuthenticated || isHydrating || isSending || isClearing) {
      return
    }

    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const sessionMessages = isAuthenticated ? messages : []
  const showHydrating = isAuthenticated && isHydrating && sessionMessages.length === 0
  const canClearConversation =
    isAuthenticated && Boolean(conversationId) && !isHydrating && (sessionMessages.length > 0 || isSending)

  return (
    <section className="flex h-full min-h-0 flex-1 overflow-hidden px-4 pb-8 sm:px-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[870px] flex-1 flex-col overflow-hidden rounded-[24px] border border-border bg-card/80 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-[12px] transition-shadow focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.4)] sm:p-[25px]">
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <ConversationTitle
              title={isAuthenticated ? conversationTitle : ""}
              canEdit={isAuthenticated && Boolean(conversationId)}
              disabled={isHydrating || isClearing}
              onSave={handleRename}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear conversation"
            className="size-8 shrink-0 cursor-pointer rounded-full"
            disabled={!canClearConversation || isClearing}
            onClick={() => setIsClearOpen(true)}
          >
            {isClearing ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Eraser aria-hidden="true" className="size-4" />
            )}
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
            <MessageScroller className="min-h-0 flex-1 overflow-hidden">
              <MessageScrollerViewport aria-label="Conversation">
                <MessageScrollerContent
                  aria-busy={showHydrating || (isAuthenticated && isSending)}
                  className="flex min-h-full w-full flex-col px-3 py-4"
                >
                  {showHydrating ? (
                    <div className="flex flex-1 items-center justify-center" role="status">
                      <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
                      <span className="sr-only">Loading conversation</span>
                    </div>
                  ) : sessionMessages.length === 0 && error ? (
                    <ChatEmptyState
                      title="Couldn't reach the chat service"
                      description="The backend may be offline. Please try again in a moment."
                    />
                  ) : sessionMessages.length === 0 ? (
                    <ChatEmptyState
                      title={
                        isAuthenticated && user
                          ? `${getTimeOfDayGreeting()}, ${user.name}!`
                          : "Please log in to start a conversation."
                      }
                      description={
                        isAuthenticated
                          ? conversationId
                            ? "Context is cleared. Send a message to continue this conversation"
                            : "What are we working on today? Press send to start a new conversation"
                          : "Log in first, then press send to start a new conversation"
                      }
                    />
                  ) : (
                    sessionMessages.map((message) => {
                      const isUser = message.role === "user"
                      const status = !isUser && isSending ? message.status : undefined
                      const isWaiting = !isUser && !message.content && isSending

                      return (
                        <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={isUser}>
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
                                {message.content ? (
                                  <ChatMarkdown content={message.content} className="text-foreground" />
                                ) : null}
                              </div>
                            )}
                          </article>
                        </MessageScrollerItem>
                      )
                    })
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton>
                <ArrowDownIcon aria-hidden="true" />
                <span className="sr-only">Jump to latest message</span>
              </MessageScrollerButton>
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        <form onSubmit={handleSubmit} className="shrink-0">
          <div className="flex w-full flex-col rounded-[20px] bg-muted px-3 py-2.5">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAuthenticated ? "Type a message…" : "Please log in to start a conversation"}
              aria-label="Chat message"
              rows={1}
              className="max-h-40 min-h-12 resize-none border-0 bg-transparent px-0 py-1 text-base leading-6 shadow-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:bg-transparent disabled:opacity-70"
              disabled={!isAuthenticated || isHydrating || isClearing}
            />
            <div className="mt-2 flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-label="Add files"
                      className="size-8 rounded-full border-border bg-background"
                      disabled={!isAuthenticated || isSending || isHydrating || isClearing}
                    />
                  }
                >
                  <PlusIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-44">
                  <DropdownMenuItem>
                    <PaperclipIcon />
                    Add Photos & Files
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <ImageIcon />
                    Create Image
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <TelescopeIcon />
                    Deep Research
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <GlobeIcon />
                    Web Search
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isSending && isAuthenticated ? (
                <Button
                  type="button"
                  size="icon"
                  aria-label="Stop generating"
                  className="size-8 cursor-pointer rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
                  onClick={handleStopStreaming}
                >
                  <Square aria-hidden="true" className="size-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send message"
                  className="size-8 cursor-pointer rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
                  disabled={!isAuthenticated || isHydrating || isClearing || !input.trim()}
                >
                  <ArrowUpIcon aria-hidden="true" className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </form>

        {isAuthenticated && error ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <Dialog
        open={isClearOpen}
        onOpenChange={(open) => {
          if (isClearing) {
            return
          }

          setIsClearOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear conversation</DialogTitle>
            <DialogDescription>
              Messages and context will be removed. This conversation stays, and the next message continues here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isClearing} onClick={() => setIsClearOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isClearing}
              onClick={() => void handleClearConversation()}
            >
              {isClearing ? "Clearing…" : "Clear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
