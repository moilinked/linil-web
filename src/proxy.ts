import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { AUTH_TOKEN_COOKIE_NAME } from "@/features/auth/session"

export function proxy(request: NextRequest) {
  const hasAccessToken = Boolean(request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value)
  if (hasAccessToken) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
