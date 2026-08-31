"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useAuth } from "@/features/auth/auth-context"

function getInitials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    return ""
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
  }

  return trimmed.slice(0, Math.min(2, trimmed.length)).toUpperCase()
}

export function AuthHeaderActions() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="rounded-full px-3 py-2 text-base font-medium text-foreground outline-none transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Login
      </Link>
    )
  }

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            aria-label={user.name}
            className="inline-flex rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <Avatar>
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </HoverCardTrigger>
      <HoverCardContent align="end" side="bottom" className="w-52 p-2">
        <p className="truncate px-2 py-1.5 text-sm font-medium">{user.name}</p>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut aria-hidden="true" className="size-4" />
          {isLoggingOut ? "Logging out…" : "Log out"}
        </Button>
      </HoverCardContent>
    </HoverCard>
  )
}
