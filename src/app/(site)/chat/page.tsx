import type { Metadata } from "next"

import { ChatPanel } from "@/features/chat/components/chat-panel"

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with me.",
}

export default function ChatPage() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <ChatPanel />
    </div>
  )
}
