import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_COOKIE_NAME,
  clearedSessionCookieOptions,
  isAuthSessionUnusable,
} from "@/features/auth/session"

function clearAuthResponseCookies(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", clearedSessionCookieOptions)
  response.cookies.set(AUTH_TOKEN_COOKIE_NAME, "", clearedSessionCookieOptions)
  return response
}

function needsSession(pathname: string) {
  return (
    pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/chat" || pathname.startsWith("/chat/")
  )
}

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return loginUrl
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value
  const sessionValue = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const pathname = request.nextUrl.pathname
  const requiresSession = needsSession(pathname)

  if (isAuthSessionUnusable(token, sessionValue)) {
    if (!requiresSession) {
      return clearAuthResponseCookies(NextResponse.next())
    }

    return clearAuthResponseCookies(NextResponse.redirect(loginRedirect(request)))
  }

  if (!requiresSession || token) {
    return NextResponse.next()
  }

  return NextResponse.redirect(loginRedirect(request))
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
}
