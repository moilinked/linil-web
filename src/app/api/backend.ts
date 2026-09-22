import { NextResponse } from "next/server"

import { backendConfigName, getBackendBaseUrl, type BackendService } from "@/config/api"
import { getAccessToken } from "@/features/auth/session"

interface ProxyAuthenticatedRequestInit {
  method?: string
  body?: string
  headers?: Record<string, string>
  service?: BackendService
}

const connectionErrors: Record<BackendService, string> = {
  chat: "Unable to connect to the Chat Agent backend",
  site: "Unable to connect to the site backend",
}

export function resolveBackendUrl(service: BackendService, pathname: string) {
  const apiBaseURL = getBackendBaseUrl(service)
  if (!apiBaseURL) {
    return {
      error: NextResponse.json(
        { error: `The server is missing the ${backendConfigName(service)} configuration` },
        { status: 500 },
      ),
    }
  }

  try {
    return { url: new URL(pathname, apiBaseURL) }
  } catch {
    return {
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
  if ("error" in resolved) {
    return resolved.error
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: "valid Bearer token required" }, { status: 401 })
  }

  try {
    const response = await fetch(resolved.url, {
      method: init?.method ?? request.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...init?.headers,
      },
      body: init?.body,
      cache: "no-store",
      signal: request.signal,
    })

    const responseBody = await response.text()
    return new Response(responseBody, {
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
