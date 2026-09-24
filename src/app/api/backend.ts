import { NextResponse } from "next/server"

import { backendConfigName, getBackendBaseUrl, type BackendService } from "@/config/api"
import { clearAuthCookies, requireAccessToken } from "@/features/auth/session"

interface ProxyAuthenticatedRequestInit {
  method?: string
  body?: BodyInit
  headers?: Record<string, string>
  service?: BackendService
}

// Per the fetch spec these statuses must not carry a body; constructing one would throw.
const bodilessStatuses = new Set([204, 205, 304])

const connectionErrors: Record<BackendService, string> = {
  chat: "Unable to connect to the Chat Agent backend",
  site: "Unable to connect to the site backend",
}

type BackendUrlResult = { ok: true; url: URL } | { ok: false; error: NextResponse }

export function resolveBackendUrl(service: BackendService, pathname: string): BackendUrlResult {
  const apiBaseURL = getBackendBaseUrl(service)
  if (!apiBaseURL) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: `The server is missing the ${backendConfigName(service)} configuration` },
        { status: 500 },
      ),
    }
  }

  try {
    return { ok: true, url: new URL(pathname, apiBaseURL) }
  } catch {
    return {
      ok: false,
      error: NextResponse.json(
        { error: `The ${backendConfigName(service)} configuration is invalid` },
        { status: 500 },
      ),
    }
  }
}

export async function proxyAuthenticatedRequest(
  request: Request,
  pathname: string,
  init?: ProxyAuthenticatedRequestInit,
) {
  const service = init?.service ?? "chat"
  const resolved = resolveBackendUrl(service, pathname)
  if (!resolved.ok) {
    return resolved.error
  }

  const access = await requireAccessToken()
  if (!access.ok) {
    return access.response
  }

  try {
    const response = await fetch(resolved.url, {
      method: init?.method ?? request.method,
      headers: {
        Authorization: `Bearer ${access.token}`,
        Accept: "application/json",
        ...init?.headers,
      },
      body: init?.body,
      cache: "no-store",
      signal: request.signal,
    })

    if (response.status === 401) {
      await clearAuthCookies()
    }

    const responseBody = bodilessStatuses.has(response.status) ? null : await response.text()
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    return NextResponse.json({ error: connectionErrors[service] }, { status: 502 })
  }
}
