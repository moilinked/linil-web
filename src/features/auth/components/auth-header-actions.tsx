"use client"

import Link from "next/link"
import { User } from "lucide-react"

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
  const label = isAuthenticated && user ? user.name : "登录"

  return (
    <Link
      href="/login"
      aria-label={label}
      title={label}
      className="inline-flex rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Avatar>
        <AvatarFallback>
          {isAuthenticated && user ? getInitials(user.name) : <User aria-hidden="true" className="size-4" />}
        </AvatarFallback>
      </Avatar>
    </Link>
  )
}
