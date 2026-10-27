import { maxTagLength, normalizeTag } from "@/features/admin/articles/tags"

export function readNoteTag(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== "string") {
    return ""
  }

  const tag = normalizeTag(raw)
  if (!tag || [...tag].length > maxTagLength) {
    return ""
  }

  return tag
}

export function noteTagHref(tag: string) {
  const params = new URLSearchParams({ tag: normalizeTag(tag) })
  return `/notes?${params.toString()}`
}
