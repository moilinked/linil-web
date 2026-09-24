import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { backendServiceForApiPath } from "@/config/api"

// Reads and deletes only. Anything that carries a request body gets an explicit route so the
// payload can be validated before it reaches the backend.
async function proxyBackend(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const service = backendServiceForApiPath(`/api/${path.join("/")}`)
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const search = new URL(request.url).search
  return proxyAuthenticatedRequest(request, `/api/${path.map(encodeURIComponent).join("/")}${search}`, { service })
}

export const GET = proxyBackend
export const DELETE = proxyBackend
