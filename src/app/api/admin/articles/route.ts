import { proxyAuthenticatedRequest } from "@/app/api/backend"
import { parseArticleCreate, parseArticleDelete } from "@/features/admin/articles/admin-article-request"

export async function GET(request: Request) {
  const { search } = new URL(request.url)

  return proxyAuthenticatedRequest(request, `/api/admin/articles${search}`, { service: "site" })
}

export async function POST(request: Request) {
  const article = await parseArticleCreate(request)
  if (!article.ok) {
    return article.response
  }

  return proxyAuthenticatedRequest(request, "/api/admin/articles", {
    service: "site",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article.value),
  })
}

export async function DELETE(request: Request) {
  const body = await parseArticleDelete(request)
  if (!body.ok) {
    return body.response
  }

  return proxyAuthenticatedRequest(request, "/api/admin/articles", {
    service: "site",
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body.value),
  })
}
