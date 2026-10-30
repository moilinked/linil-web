"use client"

import { useState } from "react"
import Link from "next/link"
import { LogOut, MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const { user, isAuthenticated, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="rounded-full px-3 py-2 text-base font-medium text-foreground transition-opacity outline-none hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Login
      </Link>
    )
  }

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={user.name}
            className="inline-flex rounded-full transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <Avatar>
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-52">
        <p className="truncate px-1.5 py-1 text-sm font-medium">{user.name}</p>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/chat" />}>
          <MessageSquare aria-hidden="true" />
          Chat
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut aria-hidden="true" />
          {isLoggingOut ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
