import { cookies } from "next/headers"

import type { AuthUser } from "@/features/auth/types"

export const AUTH_COOKIE_NAME = "chat_agent_session"

const sessionMaxAge = 60 * 60 * 24 * 30

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: sessionMaxAge,
  secure: process.env.NODE_ENV === "production",
}

export function parseSessionValue(value: string | undefined): AuthUser | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Partial<AuthUser>
    if (typeof parsed.name === "string" && parsed.name.trim()) {
      return { name: parsed.name.trim() }
    }
    return null
  } catch {
    return null
  }
}

export function serializeSessionValue(user: AuthUser): string {
  return JSON.stringify({ name: user.name })
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  return parseSessionValue(cookieStore.get(AUTH_COOKIE_NAME)?.value)
}
