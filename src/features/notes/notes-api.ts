import { notifyIfUnauthorized } from "@/features/auth/session-expiry"
import { normalizePublicNotePage, type PublicNotePage } from "@/features/notes/types"

const pageSize = 20

async function readError(response: Response, fallback: string): Promise<never> {
  notifyIfUnauthorized(response.status)
  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  throw new Error(payload?.error || fallback)
}

interface ListNotesOptions {
  after?: string
  tag?: string
  signal?: AbortSignal
}

export async function listNotes({ after, tag, signal }: ListNotesOptions = {}): Promise<PublicNotePage> {
  const params = new URLSearchParams({ first: String(pageSize) })
  if (after) {
    params.set("after", after)
  }
  if (tag) {
    params.set("tag", tag)
  }

  const response = await fetch(`/api/articles?${params}`, { cache: "no-store", signal })
  if (!response.ok) {
    return readError(response, "Failed to load notes")
  }

  const page = normalizePublicNotePage(await response.json().catch(() => null))
  if (!page) {
    throw new Error("The article service returned an invalid response")
  }

  return page
}
