export const maxTagCount = 20
export const maxTagLength = 50

export const presetTags = [
  { value: "learning notes", label: "Learning notes" },
  { value: "news summary", label: "News summary" },
  { value: "work introduction", label: "Work introduction" },
  { value: "inspiration", label: "Inspiration" },
  { value: "ai agent", label: "AI Agent" },
] as const

const presetLabels = new Map<string, string>(presetTags.map((tag) => [tag.value, tag.label]))

export function normalizeTag(value: string) {
  return value.trim().toLowerCase()
}

export function tagLabel(value: string) {
  return presetLabels.get(value) ?? value
}

export function readTagList(values: unknown): string[] | null {
  if (!Array.isArray(values)) {
    return null
  }

  const tags: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    if (typeof value !== "string") {
      return null
    }

    const tag = normalizeTag(value)
    if (!tag || [...tag].length > maxTagLength) {
      return null
    }
    if (seen.has(tag)) {
      continue
    }

    seen.add(tag)
    tags.push(tag)
  }

  if (tags.length > maxTagCount) {
    return null
  }

  return tags
}

export function sameTags(left: string[], right: string[]) {
  return left.length === right.length && left.every((tag, index) => tag === right[index])
}
