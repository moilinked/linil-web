"use client";

import { type KeyboardEvent, type SubmitEvent, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, LoaderCircle, MessageSquareDashed, RotateCw, PlusIcon, PaperclipIcon, ImageIcon, TelescopeIcon, GlobeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { sendChatMessage } from "@/features/chat/chat-api";
import { ChatMarkdown } from "@/features/chat/components/chat-markdown";
import { getChatSessionId, startNewChatSession } from "@/features/chat/conversation-session";
import type { ChatMessage } from "@/features/chat/types";
import { cn } from "@/lib/utils";

function ChatEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <MessageSquareDashed aria-hidden="true" className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Morning";
  }

  if (hour < 18) {
    return "Afternoon";
  }

  return "Evening";
}

export function ChatPanel() {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  function handleNewChat() {
    startNewChatSession();
    setMessages([]);
    setInput("");
    setError("");
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      return;
    }

    const content = input.trim();
    if (!content || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await sendChatMessage(
        {
          session_id: getChatSessionId(),
          message: content,
        },
        {
          idempotencyKey: userMessage.id,
        },
      );

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!isAuthenticated) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-1 overflow-hidden px-4 pb-8 sm:px-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[870px] flex-1 flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white/40 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-[12px] transition-shadow focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-[25px]">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-3 py-2">
          <h1 className="font-semibold">New Chat</h1>
          <Button type="button" variant="ghost" size="icon" aria-label="Start a new conversation" className="hidden size-8 rounded-full" onClick={handleNewChat} disabled={isSending}>
            <RotateCw aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="min-h-0 flex-1 overflow-hidden">
              <MessageScrollerViewport aria-label="Conversation">
                <MessageScrollerContent aria-busy={isSending} className="flex min-h-full w-full flex-col px-3 py-4">
                  {messages.length === 0 ? (
                    <ChatEmptyState
                      title={isAuthenticated && user ? `${getTimeOfDayGreeting()}, ${user.name}!` : "Please log in to start a conversation."}
                      description={isAuthenticated ? "What are we working on today? Press send to start a new conversation" : "Log in first, then press send to start a new conversation"}
                    />
                  ) : (
                    messages.map((message) => {
                      const isUser = message.role === "user";

                      return (
                        <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={isUser}>
                          <article className={cn("flex items-start", isUser && "justify-end")}>
                            {isUser ? (
                              <div className="max-w-[85%] rounded-[20px] bg-muted px-4 py-2.5 text-sm leading-6 whitespace-pre-wrap text-foreground">{message.content}</div>
                            ) : (
                              <ChatMarkdown content={message.content} className="max-w-[85%] text-foreground" />
                            )}
                          </article>
                        </MessageScrollerItem>
                      );
                    })
                  )}

                  {isSending ? (
                    <MessageScrollerItem messageId="thinking">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                        Thinking…
                      </div>
                    </MessageScrollerItem>
                  ) : null}
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
              disabled={!isAuthenticated || isSending}
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
                      disabled={!isAuthenticated || isSending}
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
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                className="size-8 rounded-full bg-[#155dfc] text-white hover:bg-[#155dfc]/90"
                disabled={!isAuthenticated || !input.trim() || isSending}
              >
                {isSending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <ArrowUpIcon aria-hidden="true" className="size-4" />}
              </Button>
            </div>
          </div>
        </form>

        {error ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
