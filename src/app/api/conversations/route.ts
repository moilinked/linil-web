import { proxyAuthenticatedRequest } from "@/app/api/backend"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return proxyAuthenticatedRequest(request, "/api/conversations")
}
