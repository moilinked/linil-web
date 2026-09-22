import { NextResponse } from "next/server"

import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { backendServiceForApiPath } from "@/config/api"

export const dynamic = "force-dynamic"

async function proxyBackend(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const pathname = `/api/${path.map(encodeURIComponent).join("/")}`
  const service = backendServiceForApiPath(`/api/${path.join("/")}`)
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return proxyAuthenticatedRequest(request, pathname, { service })
}

export const GET = proxyBackend
export const POST = proxyBackend
export const PUT = proxyBackend
export const PATCH = proxyBackend
export const DELETE = proxyBackend
