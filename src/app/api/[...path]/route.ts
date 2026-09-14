import { proxyAuthenticatedRequest } from "@/app/api/backend"

export const dynamic = "force-dynamic"

async function proxyBackend(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const pathname = `/api/${path.map(encodeURIComponent).join("/")}`
  return proxyAuthenticatedRequest(request, pathname)
}

export const GET = proxyBackend
export const POST = proxyBackend
export const PUT = proxyBackend
export const PATCH = proxyBackend
export const DELETE = proxyBackend
