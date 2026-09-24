"use client"

import { type KeyboardEvent, type SubmitEvent, useCallback, useEffect, useReducer, useRef, useState } from "react"
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
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/auth-context"
import { streamChatMessage } from "@/features/chat/chat-api"
import { CHAT_RELOAD_EVENT } from "@/features/chat/chat-reload"
import { chatReducer, createInitialChatState } from "@/features/chat/chat-state"
import { ChatMessageRow } from "@/features/chat/components/chat-message"
import { ConversationTitle } from "@/features/chat/components/conversation-title"
import {
  clearConversationMessages,
  getConversation,
  listConversations,
  toChatMessages,
  updateConversationTitle,
} from "@/features/chat/conversation-api"
import type { ChatMessage } from "@/features/chat/types"

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

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function ChatPanel() {
  const { isAuthenticated, user } = useAuth()
  const [state, dispatch] = useReducer(chatReducer, isAuthenticated, createInitialChatState)
  const [input, setInput] = useState("")
  const [isClearOpen, setIsClearOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const { phase, conversationId, title, messages, streamingMessageId, streamStatus, error } = state
  const isBusy = phase !== "idle"

  // Claiming a new requestId invalidates every callback still in flight for the previous one.
  const nextRequest = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    requestIdRef.current += 1
    return requestIdRef.current
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: "reset", requestId: nextRequest() })
      return
    }

    const requestId = nextRequest()
    const controller = new AbortController()
    dispatch({ type: "hydrate:start", requestId })

    async function loadLatestConversation() {
      try {
        const conversations = await listConversations(controller.signal)
        const latest = conversations[0]
        if (!latest) {
          dispatch({ type: "conversation:empty", requestId })
          return
        }

        const detail = await getConversation(latest.id, controller.signal)
        dispatch({
          type: "conversation:loaded",
          requestId,
          id: detail.id,
          title: detail.title,
          messages: toChatMessages(detail.id, detail.messages),
        })
      } catch (requestError) {
        if (controller.signal.aborted) {
          return
        }

        dispatch({ type: "failed", requestId, error: toErrorMessage(requestError, "Failed to load conversation") })
      }
    }

    void loadLatestConversation()

    return () => {
      controller.abort()
    }
  }, [isAuthenticated, reloadToken, nextRequest])

  useEffect(() => {
    function handleReload() {
      setReloadToken((current) => current + 1)
    }

    window.addEventListener(CHAT_RELOAD_EVENT, handleReload)
    return () => {
      window.removeEventListener(CHAT_RELOAD_EVENT, handleReload)
    }
  }, [])

  // Renaming does not interrupt a stream, so it keeps the current requestId instead of claiming a
  // new one -- and is discarded if another request took over while it was in flight.
  async function handleRename(nextTitle: string) {
    if (!conversationId) {
      return
    }

    const requestId = requestIdRef.current
    const summary = await updateConversationTitle(conversationId, nextTitle)
    dispatch({ type: "conversation:renamed", requestId, title: summary.title })
  }

  async function handleClearConversation() {
    if (!conversationId || phase === "clearing") {
      return
    }

    const requestId = nextRequest()
    dispatch({ type: "clear:start", requestId })

    try {
      const detail = await clearConversationMessages(conversationId)
      dispatch({
        type: "conversation:loaded",
        requestId,
        id: detail.id,
        title: detail.title,
        messages: toChatMessages(detail.id, detail.messages),
      })
      setIsClearOpen(false)
    } catch (requestError) {
      dispatch({ type: "failed", requestId, error: toErrorMessage(requestError, "Failed to clear conversation") })
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const content = input.trim()
    if (!isAuthenticated || isBusy || !content) {
      return
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content }
    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" }

    const requestId = nextRequest()
    const controller = new AbortController()
    abortRef.current = controller
    dispatch({ type: "send:start", requestId, userMessage, assistantMessage })
    setInput("")

    try {
      await streamChatMessage(
        {
          ...(conversationId ? { conversation_id: conversationId } : {}),
          message: content,
        },
        {
          idempotencyKey: userMessage.id,
          signal: controller.signal,
          onText(nextContent) {
            dispatch({ type: "stream:text", requestId, content: nextContent })
          },
          onStatus(status) {
            dispatch({ type: "stream:status", requestId, status })
          },
          onConversationId(nextConversationId) {
            dispatch({
              type: "conversation:adopted",
              requestId,
              id: nextConversationId,
              fallbackTitle: content.slice(0, 40),
            })
          },
        },
      )
      dispatch({ type: "settled", requestId })
    } catch (requestError) {
      if (controller.signal.aborted) {
        dispatch({ type: "aborted", requestId })
        return
      }

      dispatch({ type: "failed", requestId, error: toErrorMessage(requestError, "Failed to send message") })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!isAuthenticated || isBusy) {
      return
    }

    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const isStreaming = phase === "streaming"
  const isClearing = phase === "clearing"
  const isInputLocked = !isAuthenticated || phase === "hydrating" || isClearing
  const showHydrating = phase === "hydrating" && messages.length === 0
  const canClearConversation = isAuthenticated && Boolean(conversationId) && (messages.length > 0 || isStreaming)

  return (
    <section className="flex h-full min-h-0 flex-1 overflow-hidden px-4 pb-8 sm:px-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[870px] flex-1 flex-col overflow-hidden rounded-[24px] border border-border bg-card/80 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-[12px] transition-shadow focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.4)] sm:p-[25px]">
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <ConversationTitle
              title={title}
              canEdit={isAuthenticated && Boolean(conversationId)}
              disabled={phase === "hydrating" || isClearing}
              onSave={handleRename}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear conversation"
            className="size-8 shrink-0 cursor-pointer rounded-full"
            disabled={!canClearConversation || phase === "hydrating" || isClearing}
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
                  aria-busy={showHydrating || isStreaming}
                  className="flex min-h-full w-full flex-col px-3 py-4"
                >
                  {showHydrating ? (
                    <div className="flex flex-1 items-center justify-center" role="status">
                      <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
                      <span className="sr-only">Loading conversation</span>
                    </div>
                  ) : messages.length === 0 && error ? (
                    <ChatEmptyState
                      title="Couldn't reach the chat service"
                      description="The backend may be offline. Please try again in a moment."
                    />
                  ) : messages.length === 0 ? (
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
                    messages.map((message) => {
                      const isStreamingRow = message.id === streamingMessageId

                      return (
                        <ChatMessageRow
                          key={message.id}
                          message={message}
                          isStreaming={isStreamingRow}
                          status={isStreamingRow ? streamStatus : undefined}
                        />
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
              disabled={isInputLocked}
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
                      disabled={isInputLocked || isStreaming}
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
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  aria-label="Stop generating"
                  className="size-8 cursor-pointer rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
                  onClick={() => abortRef.current?.abort()}
                >
                  <Square aria-hidden="true" className="size-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send message"
                  className="size-8 cursor-pointer rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
                  disabled={isInputLocked || !input.trim()}
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
