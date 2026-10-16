export type NoteAudience = "public" | "user" | "admin"
export type NoteContentType = "markdown" | "frontend"

export const noteSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface PublicNote {
  id: string
  slug: string
  title: string
  summary: string
  coverFileKey: string
  publishedAt: string
  audience: NoteAudience
  hasPdf: boolean
}

export interface PublicNotePage {
  items: PublicNote[]
  endCursor: string
  hasNextPage: boolean
}

export interface PublicNoteDetail extends PublicNote {
  html: string
  contentType: NoteContentType
}

const audiences = new Set<NoteAudience>(["public", "user", "admin"])

export function normalizePublicNote(value: unknown): PublicNote | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const payload = value as {
    id?: unknown
    slug?: unknown
    title?: unknown
    summary?: unknown
    cover_file_key?: unknown
    published_at?: unknown
    audience?: unknown
    pdf_url?: unknown
  }

  if (typeof payload.id !== "string" || typeof payload.slug !== "string") {
    return null
  }

  return {
    id: payload.id,
    slug: payload.slug,
    title: typeof payload.title === "string" ? payload.title.trim() : "",
    summary: typeof payload.summary === "string" ? payload.summary.trim() : "",
    coverFileKey: typeof payload.cover_file_key === "string" ? payload.cover_file_key : "",
    publishedAt: typeof payload.published_at === "string" ? payload.published_at : "",
    audience: audiences.has(payload.audience as NoteAudience) ? (payload.audience as NoteAudience) : "public",
    hasPdf: typeof payload.pdf_url === "string" && payload.pdf_url.length > 0,
  }
}

export function normalizePublicNotePage(value: unknown): PublicNotePage | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const payload = value as { items?: unknown; end_cursor?: unknown; has_next_page?: unknown }
  if (!Array.isArray(payload.items) || typeof payload.has_next_page !== "boolean") {
    return null
  }

  return {
    items: payload.items.flatMap((item) => {
      const note = normalizePublicNote(item)
      return note ? [note] : []
    }),
    endCursor: typeof payload.end_cursor === "string" ? payload.end_cursor : "",
    hasNextPage: payload.has_next_page,
  }
}

export function normalizePublicNoteDetail(value: unknown): PublicNoteDetail | null {
  const note = normalizePublicNote(value)
  if (!note || !value || typeof value !== "object") {
    return null
  }

  const payload = value as { html?: unknown; content_type?: unknown }

  return {
    ...note,
    html: typeof payload.html === "string" ? payload.html : "",
    contentType: payload.content_type === "frontend" ? "frontend" : "markdown",
  }
}
