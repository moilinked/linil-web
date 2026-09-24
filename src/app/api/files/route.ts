import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"

// Matches the site backend default for FILE_MAX_UPLOAD_BYTES. The backend still has the last
// word; this only avoids buffering a payload that is going to be rejected anyway.
const maxUploadBytes = 50 * 1024 * 1024

export async function GET(request: Request) {
  const { search } = new URL(request.url)

  return proxyAuthenticatedRequest(request, `/api/files${search}`, { service: "site" })
}

export async function POST(request: Request) {
  const contentType = request.headers.get("Content-Type") || ""
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Upload must use multipart/form-data" }, { status: 415 })
  }

  const body = await request.arrayBuffer()
  if (body.byteLength > maxUploadBytes) {
    return NextResponse.json({ error: "The file is larger than 50 MiB" }, { status: 413 })
  }

  return proxyAuthenticatedRequest(request, "/api/files", {
    service: "site",
    method: "POST",
    // Forwarded verbatim so the multipart boundary survives.
    headers: { "Content-Type": contentType },
    body,
  })
}
