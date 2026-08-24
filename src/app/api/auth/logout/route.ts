import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/features/auth/session"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
