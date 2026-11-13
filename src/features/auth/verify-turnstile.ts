import "server-only"

import { getTurnstileSecret } from "@/config/turnstile"

interface SiteverifyResponse {
  success?: boolean
}

export function readClientIp(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || ""
  return forwarded.split(",")[0]?.trim() ?? ""
}

export async function verifyTurnstileToken(token: string, remoteIp: string) {
  const responseToken = token.trim()
  if (!responseToken) {
    return { ok: false as const, error: "Complete the verification challenge" }
  }

  const secret = getTurnstileSecret()
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return { ok: true as const }
    }
    return { ok: false as const, error: "Turnstile is not configured" }
  }

  const body = new URLSearchParams({
    secret,
    response: responseToken,
  })
  if (remoteIp) {
    body.set("remoteip", remoteIp)
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
    const payload = (await response.json().catch(() => null)) as SiteverifyResponse | null
    if (!response.ok || !payload?.success) {
      return { ok: false as const, error: "Verification failed. Please try again." }
    }
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "Unable to reach the verification service" }
  }
}
