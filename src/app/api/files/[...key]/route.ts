import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest, resolveBackendUrl } from "@/app/api/backend"

// The backend expects each key segment percent-encoded with the separators left intact.
function encodeKey(segments: string[]) {
  return segments.map(encodeURIComponent).join("/")
}

const forwardedRequestHeaders = ["Range", "If-None-Match", "If-Modified-Since"]

const forwardedResponseHeaders = [
  "Content-Type",
  "Content-Length",
  "Content-Disposition",
  "Content-Range",
  "Accept-Ranges",
  "Cache-Control",
  "ETag",
  "Last-Modified",
]

function pickHeaders(source: Headers, names: string[]) {
  const headers = new Headers()

  for (const name of names) {
    const value = source.get(name)
    if (value) {
      headers.set(name, value)
    }
  }

  return headers
}

// Reading a file needs no session, and the response is streamed rather than buffered so images
// can be used directly as an <img> source.
export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params
  const resolved = resolveBackendUrl("site", `/api/files/${encodeKey(key)}`)
  if (!resolved.ok) {
    return resolved.error
  }

  try {
    const response = await fetch(resolved.url, {
      headers: pickHeaders(request.headers, forwardedRequestHeaders),
      cache: "no-store",
      signal: request.signal,
    })

    return new Response(response.status === 304 ? null : response.body, {
      status: response.status,
      headers: pickHeaders(response.headers, forwardedResponseHeaders),
    })
  } catch {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    return NextResponse.json({ error: "Unable to connect to the site backend" }, { status: 502 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params

  return proxyAuthenticatedRequest(request, `/api/files/${encodeKey(key)}`, { service: "site" })
}
