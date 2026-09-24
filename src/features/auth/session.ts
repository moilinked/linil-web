import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { AuthUser } from "@/features/auth/types"

export const AUTH_COOKIE_NAME = "chat_agent_session"
export const AUTH_TOKEN_COOKIE_NAME = "chat_agent_access_token"

export const sessionMaxAge = 60 * 60 * 24 * 30

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: sessionMaxAge,
  secure: process.env.NODE_ENV === "production",
}

export const clearedSessionCookieOptions = {
  ...sessionCookieOptions,
  maxAge: 0,
}

const unauthorizedResponse = () => NextResponse.json({ error: "valid Bearer token required" }, { status: 401 })

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

// A session is only usable when both cookies are present and the profile cookie still parses.
function readSessionUser(token: string | undefined, sessionValue: string | undefined) {
  return token ? parseSessionValue(sessionValue) : null
}

// Distinguishes "signed out" from "has stale cookies that need clearing".
export function isAuthSessionUnusable(token: string | undefined, sessionValue: string | undefined) {
  if (!token && !sessionValue) {
    return false
  }

  return !readSessionUser(token, sessionValue)
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, "", clearedSessionCookieOptions)
  cookieStore.set(AUTH_TOKEN_COOKIE_NAME, "", clearedSessionCookieOptions)
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()

  return readSessionUser(cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value, cookieStore.get(AUTH_COOKIE_NAME)?.value)
}

export async function requireAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value
  const sessionValue = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token || isAuthSessionUnusable(token, sessionValue)) {
    if (token || sessionValue) {
      await clearAuthCookies()
    }

    return { ok: false, response: unauthorizedResponse() }
  }

  return { ok: true, token }
}
