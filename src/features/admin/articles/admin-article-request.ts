import { NextResponse } from "next/server"

const articleIdPattern = /^[0-9a-f]{32}$/
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const audiences = new Set(["public", "user", "admin"])
const maxTitleLength = 200
const maxSummaryLength = 1000
const maxMarkdownBytes = 1024 * 1024
const maxJsonBytes = 2 * 1024 * 1024

const maxDeleteBatch = 100
const createFields = new Set(["slug", "audience"])
const deleteFields = new Set(["ids"])
const draftFields = new Set(["slug", "audience", "title", "summary", "markdown", "cover_file_key", "expected_version"])

export interface ArticleDraftBody {
  slug: string
  audience: string
  title: string
  summary: string
  markdown: string
  cover_file_key: string
  expected_version: number
}

type ParseResult<T> = { ok: true; value: T } | { ok: false; response: NextResponse }

export function parseArticleId(id: string) {
  return articleIdPattern.test(id)
}

export async function parseArticleCreate(request: Request): Promise<ParseResult<{ slug: string; audience: string }>> {
  const payload = await readJsonObject(request, createFields)
  if (!payload.ok) {
    return payload
  }

  const slug = readOptionalString(payload.value.slug)
  const audience = readOptionalString(payload.value.audience)
  if (slug === null || !isValidSlug(slug) || audience === null || (audience !== "" && !audiences.has(audience))) {
    return invalid("article is invalid")
  }

  return {
    ok: true,
    value: {
      slug: slug.toLowerCase(),
      audience: audience || "public",
    },
  }
}

export async function parseArticleDraft(request: Request): Promise<ParseResult<ArticleDraftBody>> {
  const payload = await readJsonObject(request, draftFields)
  if (!payload.ok) {
    return payload
  }

  const slug = readOptionalString(payload.value.slug)
  const audience = readOptionalString(payload.value.audience)
  const title = readTrimmedString(payload.value.title)
  const summary = readTrimmedString(payload.value.summary)
  const markdown = readRequiredString(payload.value.markdown)
  const coverFileKey = readCoverFileKey(payload.value.cover_file_key)
  const expectedVersion = payload.value.expected_version

  if (
    slug === null ||
    (slug !== "" && !isValidSlug(slug)) ||
    audience === null ||
    (audience !== "" && !audiences.has(audience)) ||
    title === null ||
    [...title].length > maxTitleLength ||
    summary === null ||
    [...summary].length > maxSummaryLength ||
    markdown === null ||
    byteLength(markdown) > maxMarkdownBytes ||
    coverFileKey === null ||
    !isValidVersion(expectedVersion)
  ) {
    return invalid("article draft is invalid")
  }

  return {
    ok: true,
    value: {
      slug: slug.toLowerCase(),
      audience,
      title,
      summary,
      markdown,
      cover_file_key: coverFileKey,
      expected_version: expectedVersion,
    },
  }
}

export async function parseArticleDelete(request: Request): Promise<ParseResult<{ ids: string[] }>> {
  const payload = await readJsonObject(request, deleteFields)
  if (!payload.ok) {
    return payload
  }

  if (!Array.isArray(payload.value.ids)) {
    return invalid("article is invalid")
  }

  const ids: string[] = []
  const seen = new Set<string>()
  for (const value of payload.value.ids) {
    if (typeof value !== "string" || !parseArticleId(value.trim())) {
      return invalid("article is invalid")
    }

    const id = value.trim()
    if (seen.has(id)) {
      continue
    }

    seen.add(id)
    ids.push(id)
  }

  if (ids.length === 0 || ids.length > maxDeleteBatch) {
    return invalid("article is invalid")
  }

  return { ok: true, value: { ids } }
}

export async function parseArticlePreview(request: Request): Promise<ParseResult<{ markdown: string }>> {
  const payload = await readJsonObject(request, new Set(["markdown"]))
  if (!payload.ok) {
    return payload
  }

  const markdown = readRequiredString(payload.value.markdown)
  if (markdown === null || byteLength(markdown) > maxMarkdownBytes) {
    return invalid("article preview is invalid")
  }

  return { ok: true, value: { markdown } }
}

export async function parsePublishedAt(request: Request): Promise<ParseResult<{ published_at: string }>> {
  const payload = await readJsonObject(request, new Set(["published_at"]))
  if (!payload.ok) {
    return payload
  }

  if (typeof payload.value.published_at !== "string") {
    return invalid("published_at is invalid")
  }

  const publishedAt = new Date(payload.value.published_at)
  if (Number.isNaN(publishedAt.getTime()) || publishedAt.getUTCFullYear() <= 1) {
    return invalid("published_at is invalid")
  }

  return { ok: true, value: { published_at: publishedAt.toISOString() } }
}

async function readJsonObject(
  request: Request,
  allowedFields: Set<string>,
): Promise<ParseResult<Record<string, unknown>>> {
  const contentType = request.headers.get("Content-Type") || ""
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 }),
    }
  }

  const raw = await request.text()
  if (byteLength(raw) > maxJsonBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "request body is too large" }, { status: 413 }),
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return invalid("invalid JSON request body")
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return invalid("invalid JSON request body")
  }

  const value = parsed as Record<string, unknown>
  if (Object.keys(value).some((key) => !allowedFields.has(key))) {
    return invalid("invalid JSON request body")
  }

  return { ok: true, value }
}

function readOptionalString(value: unknown) {
  if (value === undefined) {
    return ""
  }

  return typeof value === "string" ? value.trim() : null
}

function readRequiredString(value: unknown) {
  return typeof value === "string" ? value : null
}

function readTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : null
}

function readCoverFileKey(value: unknown) {
  if (value === undefined) {
    return ""
  }

  return typeof value === "string" ? value : null
}

function isValidSlug(value: string) {
  return value.length <= 200 && slugPattern.test(value.toLowerCase())
}

function isValidVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength
}

function invalid(error: string): ParseResult<never> {
  return { ok: false, response: NextResponse.json({ error }, { status: 400 }) }
}
