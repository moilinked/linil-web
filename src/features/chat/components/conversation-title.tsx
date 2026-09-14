"use client"

import { type KeyboardEvent, useState } from "react"

import { Input } from "@/components/ui/input"
import { conversationTitleMaxLength, normalizeConversationTitle } from "@/features/chat/types"
import { cn } from "@/lib/utils"

function titleLength(value: string) {
  return [...value].length
}

interface ConversationTitleProps {
  title: string
  canEdit: boolean
  disabled?: boolean
  onSave: (title: string) => Promise<void>
}

export function ConversationTitle({ title, canEdit, disabled, onSave }: ConversationTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function commit() {
    if (saving || disabled) {
      return
    }

    const next = normalizeConversationTitle(draft)
    if (!next) {
      setDraft(title)
      setEditing(false)
      setError("")
      return
    }

    if (titleLength(next) > conversationTitleMaxLength) {
      setError("title is too long")
      return
    }

    if (next === title) {
      setEditing(false)
      setError("")
      return
    }

    setSaving(true)
    setError("")

    try {
      await onSave(next)
      setEditing(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to rename conversation")
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setDraft(title)
    setError("")
    setEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      void commit()
    }

    if (event.key === "Escape") {
      event.preventDefault()
      cancel()
    }
  }

  if (!canEdit || !editing) {
    return (
      <h1
        className={cn("min-w-0 truncate font-semibold", canEdit && !disabled && "select-none")}
        onDoubleClick={() => {
          if (canEdit && !disabled) {
            setDraft(title)
            setError("")
            setEditing(true)
          }
        }}
      >
        {title || "New Chat"}
      </h1>
    )
  }

  return (
    <div className="min-w-0 flex-1">
      <Input
        autoFocus
        value={draft}
        aria-label="Conversation title"
        aria-invalid={Boolean(error)}
        disabled={saving || disabled}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const value = event.target.value
          if (titleLength(value) <= conversationTitleMaxLength) {
            setDraft(value)
            setError("")
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          void commit()
        }}
        className="h-8 border-border bg-background font-semibold"
      />
      {error ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
