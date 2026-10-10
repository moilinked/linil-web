export type ArticleStatus = "draft" | "published"
export type ArticleAudience = "public" | "user" | "admin"
export type ArticleSort = "published_at" | "updated_at" | "created_at"
export type ArticleSortOrder = "asc" | "desc"

export interface AdminArticle {
  id: string
  slug: string
  status: ArticleStatus
  audience: ArticleAudience
  publishedAt: string | null
  hasPdf: boolean
  title: string
  summary: string
  coverFileKey: string
  updatedAt: string
}

export interface ArticleDraft {
  title: string
  summary: string
  markdown: string
  coverFileKey: string
  version: number
  updatedAt: string
}

export interface AdminArticleDetail {
  id: string
  slug: string
  status: ArticleStatus
  audience: ArticleAudience
  publishedAt: string | null
  hasPdf: boolean
  slugLocked: boolean
  draft: ArticleDraft
}

interface ArticleContentPayload {
  title?: unknown
  summary?: unknown
  markdown?: unknown
  cover_file_key?: unknown
  version?: unknown
  updated_at?: unknown
}

interface AdminArticlePayload {
  id?: unknown
  slug?: unknown
  status?: unknown
  audience?: unknown
  published_at?: unknown
  pdf_url?: unknown
  draft?: ArticleContentPayload
  publication?: ArticleContentPayload
  updated_at?: unknown
}

const statuses = new Set<ArticleStatus>(["draft", "published"])
const audiences = new Set<ArticleAudience>(["public", "user", "admin"])

export function normalizeAdminArticle(value: unknown): AdminArticle | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const payload = value as AdminArticlePayload
  if (
    typeof payload.id !== "string" ||
    typeof payload.slug !== "string" ||
    !statuses.has(payload.status as ArticleStatus)
  ) {
    return null
  }

  const draft = readContent(payload.draft)
  const publication = readContent(payload.publication)
  const content = draft.title || draft.summary || draft.coverFileKey ? draft : publication

  return {
    id: payload.id,
    slug: payload.slug,
    status: payload.status as ArticleStatus,
    audience: audiences.has(payload.audience as ArticleAudience) ? (payload.audience as ArticleAudience) : "public",
    publishedAt: typeof payload.published_at === "string" ? payload.published_at : null,
    hasPdf: typeof payload.pdf_url === "string" && payload.pdf_url.length > 0,
    title: content.title,
    summary: content.summary,
    coverFileKey: content.coverFileKey,
    updatedAt: typeof payload.updated_at === "string" ? payload.updated_at : "",
  }
}

function readContent(value: ArticleContentPayload | undefined) {
  return {
    title: typeof value?.title === "string" ? value.title.trim() : "",
    summary: typeof value?.summary === "string" ? value.summary.trim() : "",
    coverFileKey: typeof value?.cover_file_key === "string" ? value.cover_file_key : "",
  }
}

export interface ArticleDraftInput {
  slug: string
  audience: ArticleAudience
  title: string
  summary: string
  markdown: string
  coverFileKey: string
  expectedVersion: number
}

export function normalizeAdminArticleDetail(value: unknown): AdminArticleDetail | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const payload = value as AdminArticlePayload
  if (
    typeof payload.id !== "string" ||
    typeof payload.slug !== "string" ||
    !statuses.has(payload.status as ArticleStatus) ||
    !payload.draft ||
    typeof payload.draft.version !== "number"
  ) {
    return null
  }

  const draft = readContent(payload.draft)

  return {
    id: payload.id,
    slug: payload.slug,
    status: payload.status as ArticleStatus,
    audience: audiences.has(payload.audience as ArticleAudience) ? (payload.audience as ArticleAudience) : "public",
    publishedAt: typeof payload.published_at === "string" ? payload.published_at : null,
    hasPdf: typeof payload.pdf_url === "string" && payload.pdf_url.length > 0,
    slugLocked: Boolean(payload.publication),
    draft: {
      title: draft.title,
      summary: draft.summary,
      markdown: typeof payload.draft.markdown === "string" ? payload.draft.markdown : "",
      coverFileKey: draft.coverFileKey,
      version: payload.draft.version,
      updatedAt: typeof payload.draft.updated_at === "string" ? payload.draft.updated_at : "",
    },
  }
}
