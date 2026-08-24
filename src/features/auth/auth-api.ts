import type { AuthResponse, AuthUser, LoginRequest } from "@/features/auth/types"

async function readAuthPayload(response: Response): Promise<AuthResponse | { error?: string } | null> {
  return (await response.json().catch(() => null)) as AuthResponse | { error?: string } | null
}

function getErrorMessage(payload: AuthResponse | { error?: string } | null, fallback: string) {
  return payload && "error" in payload && payload.error ? payload.error : fallback
}

export async function loginRequest(request: LoginRequest): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  const payload = await readAuthPayload(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "登录失败"))
  }

  if (!payload || !("user" in payload) || typeof payload.user?.name !== "string") {
    throw new Error("登录服务返回了无效响应")
  }

  return payload.user
}

export async function logoutRequest(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  })

  if (!response.ok) {
    const payload = await readAuthPayload(response)
    throw new Error(getErrorMessage(payload, "退出登录失败"))
  }
}
