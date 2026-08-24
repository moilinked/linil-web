import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  serializeSessionValue,
  sessionCookieOptions,
} from "@/features/auth/session"
import type { AuthUser, LoginRequest } from "@/features/auth/types"

const minUsernameLength = 2
const maxUsernameLength = 32
const minPasswordLength = 6

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<LoginRequest> | null
  const username = body?.username?.trim() ?? ""
  const password = body?.password ?? ""

  if (!username || !password) {
    return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 })
  }

  if (username.length < minUsernameLength || username.length > maxUsernameLength) {
    return NextResponse.json({ error: `用户名长度需为 ${minUsernameLength}-${maxUsernameLength} 个字符` }, { status: 400 })
  }

  if (password.length < minPasswordLength) {
    return NextResponse.json({ error: `密码至少 ${minPasswordLength} 位` }, { status: 400 })
  }

  const user: AuthUser = { name: username }
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, serializeSessionValue(user), sessionCookieOptions)

  return NextResponse.json({ user })
}
