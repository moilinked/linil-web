import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { resolveBackendUrl } from "@/app/api/backend"
import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_COOKIE_NAME,
  serializeSessionValue,
  sessionCookieOptions,
  sessionMaxAge,
} from "@/features/auth/session"
import type { AuthUser, LoginRequest } from "@/features/auth/types"

interface BackendLoginPayload {
  access_token?: unknown
  accessToken?: unknown
  token?: unknown
  token_type?: unknown
  expires_in?: unknown
  error?: unknown
  message?: unknown
  detail?: unknown
  user?: {
    name?: unknown
    username?: unknown
  }
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function readErrorMessage(payload: BackendLoginPayload | null, fallback: string) {
  return readString(payload?.error) || readString(payload?.message) || readString(payload?.detail) || fallback
}

function readAccessToken(payload: BackendLoginPayload | null) {
  if (!payload) {
    return ""
  }

  return readString(payload.access_token) || readString(payload.accessToken) || readString(payload.token)
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<LoginRequest> | null
  const username = body?.username?.trim() ?? ""
  const password = body?.password ?? ""

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
  }

  const resolved = resolveBackendUrl("site", "/api/auth/login")
  if ("error" in resolved) {
    return resolved.error
  }
  const backendURL = resolved.url

  let response: Response
  try {
    response = await fetch(backendURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password } satisfies LoginRequest),
      cache: "no-store",
      signal: request.signal,
    })
  } catch {
    return NextResponse.json({ error: "Unable to connect to the authentication service" }, { status: 502 })
  }

  const payload = (await response.json().catch(() => null)) as BackendLoginPayload | null

  if (!response.ok) {
    return NextResponse.json({ error: readErrorMessage(payload, "Login failed") }, { status: response.status })
  }

  const accessToken = readAccessToken(payload)
  if (!accessToken) {
    return NextResponse.json({ error: "The authentication service returned an invalid response" }, { status: 502 })
  }

  const tokenType = readString(payload?.token_type) || "Bearer"
  const expiresIn =
    typeof payload?.expires_in === "number" && Number.isFinite(payload.expires_in) && payload.expires_in > 0
      ? Math.floor(payload.expires_in)
      : sessionMaxAge
  const user: AuthUser = {
    name: readString(payload?.user?.name) || readString(payload?.user?.username) || username,
  }
  const cookieStore = await cookies()
  const cookieOptions = {
    ...sessionCookieOptions,
    maxAge: expiresIn,
  }

  cookieStore.set(AUTH_COOKIE_NAME, serializeSessionValue(user), cookieOptions)
  cookieStore.set(AUTH_TOKEN_COOKIE_NAME, accessToken, cookieOptions)

  if (process.env.NODE_ENV === "development") {
    console.info("[auth] Bearer token stored", {
      tokenType,
      expiresIn,
      tokenLength: accessToken.length,
      tokenPreview: `${accessToken.slice(0, 8)}…`,
    })
  }

  return NextResponse.json({ user })
}
