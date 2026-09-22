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

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value
  const sessionValue = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const isAdmin = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")

  if (isAuthSessionUnusable(token, sessionValue)) {
    if (!isAdmin) {
      return clearAuthResponseCookies(NextResponse.next())
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return clearAuthResponseCookies(NextResponse.redirect(loginUrl))
  }

  if (!isAdmin || token) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
}
