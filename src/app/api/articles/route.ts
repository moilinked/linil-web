import { proxyPublicSiteRequest } from "@/app/api/backend"

export async function GET(request: Request) {
  const search = new URL(request.url).search
  return proxyPublicSiteRequest(request, `/api/articles${search}`)
}
