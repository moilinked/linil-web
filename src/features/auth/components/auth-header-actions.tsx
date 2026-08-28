"use client"

import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  const { user, isAuthenticated } = useAuth()

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

  return (
    <Link
      href="/login"
      aria-label={user.name}
      title={user.name}
      className="inline-flex rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Avatar>
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
    </Link>
  )
}
