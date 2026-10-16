import { cache } from "react"

import { resolveBackendUrl } from "@/app/api/backend"
import { clearAuthCookies, readOptionalAccessToken } from "@/features/auth/session"
import { normalizePublicNoteDetail, noteSlugPattern, type PublicNoteDetail } from "@/features/notes/types"

export const getPublishedNote = cache(async (slug: string): Promise<PublicNoteDetail | null> => {
  if (!noteSlugPattern.test(slug)) {
    return null
  }

  const resolved = resolveBackendUrl("site", `/api/articles/${slug}`)
  if (!resolved.ok) {
    throw new Error("Unable to connect to the site backend")
  }
  const token = await readOptionalAccessToken()
  let response: Response
  try {
    response = await fetch(resolved.url, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })
  } catch {
    throw new Error("Unable to connect to the site backend")
  }

  if (response.status === 404) {
    return null
  }

  if (response.status === 401 && token) {
    await clearAuthCookies()
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error || "Failed to load the note")
  }

  const note = normalizePublicNoteDetail(await response.json().catch(() => null))
  if (!note) {
    throw new Error("The article service returned an invalid response")
  }

  return note
})
