import { notifyIfUnauthorized } from "@/features/auth/session-expiry"
import {
  normalizeAdminArticle,
  normalizeAdminArticleDetail,
  type AdminArticle,
  type AdminArticleDetail,
  type ArticleAudience,
  type ArticleDraftInput,
  type ArticleSort,
  type ArticleSortOrder,
} from "@/features/admin/articles/types"

async function readError(response: Response, fallback: string): Promise<never> {
  notifyIfUnauthorized(response.status)
  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  throw new Error(payload?.error || fallback)
}

async function readArticle(response: Response, fallback: string) {
  if (!response.ok) {
    return readError(response, fallback)
  }

  const article = normalizeAdminArticleDetail(await response.json().catch(() => null))
  if (!article) {
    throw new Error("The article service returned an invalid response")
  }

  return article
}

interface ListAdminArticlesOptions {
  name?: string
  sort?: ArticleSort
  order?: ArticleSortOrder
  signal?: AbortSignal
}

export async function listAdminArticles({ name, sort, order, signal }: ListAdminArticlesOptions = {}): Promise<
  AdminArticle[]
> {
  const params = new URLSearchParams()
  if (name) {
    params.set("name", name)
  }
  if (sort) {
    params.set("sort", sort)
  }
  if (order) {
    params.set("order", order)
  }

  const query = params.size ? `?${params}` : ""
  const response = await fetch(`/api/admin/articles${query}`, { cache: "no-store", signal })
  if (!response.ok) {
    return readError(response, "Failed to load notes")
  }

  const payload = (await response.json().catch(() => null)) as { items?: unknown } | null
  if (!Array.isArray(payload?.items)) {
    return []
  }

  return payload.items.flatMap((item) => {
    const article = normalizeAdminArticle(item)
    return article ? [article] : []
  })
}

export async function deleteAdminArticles(ids: string[]) {
  const response = await fetch("/api/admin/articles", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
  if (response.status === 502) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    if (payload?.error === "article deleted but pdf cleanup failed") {
      return payload.error
    }

    throw new Error(payload?.error || "Failed to delete the note")
  }
  if (!response.ok) {
    return readError(response, "Failed to delete the note")
  }

  return ""
}

export async function createAdminArticle(slug: string, audience: ArticleAudience) {
  const response = await fetch("/api/admin/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, audience }),
  })

  return readArticle(response, "Failed to create the note")
}

export async function getAdminArticle(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/admin/articles/${id}`, { cache: "no-store", signal })
  return readArticle(response, "Failed to load the note")
}

export async function saveAdminArticleDraft(id: string, draft: ArticleDraftInput): Promise<AdminArticleDetail> {
  const response = await fetch(`/api/admin/articles/${id}/draft`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: draft.slug,
      content_type: draft.contentType,
      audience: draft.audience,
      tags: draft.tags,
      title: draft.title,
      summary: draft.summary,
      markdown: draft.markdown,
      cover_file_key: draft.coverFileKey,
      expected_version: draft.expectedVersion,
    }),
  })

  return readArticle(response, "Failed to save the draft")
}

export async function previewAdminArticle(id: string, markdown: string) {
  const response = await fetch(`/api/admin/articles/${id}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown }),
  })
  if (!response.ok) {
    return readError(response, "Failed to preview the note")
  }

  const payload = (await response.json().catch(() => null)) as { html?: unknown } | null
  if (typeof payload?.html !== "string") {
    throw new Error("The article service returned an invalid response")
  }

  return payload.html
}

export async function updateAdminArticlePublishedAt(id: string, publishedAt: string) {
  const response = await fetch(`/api/admin/articles/${id}/published-at`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ published_at: publishedAt }),
  })

  return readArticle(response, "Failed to update the publish time")
}

export async function publishAdminArticle(id: string) {
  const response = await fetch(`/api/admin/articles/${id}/publish`, { method: "POST" })
  return readArticle(response, "Failed to publish the note")
}

export async function unpublishAdminArticle(id: string) {
  const response = await fetch(`/api/admin/articles/${id}/unpublish`, { method: "POST" })
  return readArticle(response, "Failed to unpublish the note")
}
