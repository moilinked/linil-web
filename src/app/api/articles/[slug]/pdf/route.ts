import { NextResponse } from "next/server"

import { resolveBackendUrl } from "@/app/api/backend"
import { clearAuthCookies, readOptionalAccessToken } from "@/features/auth/session"
import { noteSlugPattern } from "@/features/notes/types"

const forwardedResponseHeaders = ["Content-Type", "Content-Length", "Content-Disposition", "Cache-Control"]

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  if (!noteSlugPattern.test(slug)) {
    return NextResponse.json({ error: "article not found" }, { status: 404 })
  }

  const resolved = resolveBackendUrl("site", `/api/articles/${slug}/pdf`)
  if (!resolved.ok) {
    return resolved.error
  }

  const token = await readOptionalAccessToken()

  try {
    const response = await fetch(resolved.url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
      signal: request.signal,
    })

    if (response.status === 401 && token) {
      await clearAuthCookies()
    }

    const headers = new Headers()
    for (const name of forwardedResponseHeaders) {
      const value = response.headers.get(name)
      if (value) {
        headers.set(name, value)
      }
    }
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", "private, no-store")
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    })
  } catch {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    return NextResponse.json({ error: "Unable to connect to the site backend" }, { status: 502 })
  }
}
