import { NextResponse } from "next/server"

import { getApiUrl } from "@/config/api"
import { getAccessToken } from "@/features/auth/session"

interface ProxyAuthenticatedRequestInit {
  method?: string
  body?: string
  headers?: Record<string, string>
}

export async function proxyAuthenticatedRequest(request: Request, pathname: string, init?: ProxyAuthenticatedRequestInit) {
  const apiBaseURL = getApiUrl()
  if (!apiBaseURL) {
    return NextResponse.json({ error: "The server is missing the API_URL configuration" }, { status: 500 })
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: "valid Bearer token required" }, { status: 401 })
  }

  let backendURL: URL
  try {
    backendURL = new URL(pathname, apiBaseURL)
  } catch {
    return NextResponse.json({ error: "The API_URL configuration is invalid" }, { status: 500 })
  }

  try {
    const response = await fetch(backendURL, {
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

    return NextResponse.json({ error: "Unable to connect to the Chat Agent backend" }, { status: 502 })
  }
}
