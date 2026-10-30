import "server-only"

import { getUmamiApiConfig } from "@/config/umami"

import type { SessionPageView, VisitorSession, VisitorSessionResult, VisitorSessionsResult } from "./types"
import { umamiFailure, umamiGet } from "./umami-request"

const rangeDays = 30
const pageSize = 100
const maxPages = 5

export const visitorSessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }

  return 0
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readSession(value: unknown): VisitorSession | null {
  if (!isRecord(value) || !visitorSessionIdPattern.test(readText(value.id))) {
    return null
  }

  const distinctIds = Array.isArray(value.distinctIds)
    ? value.distinctIds.flatMap((item) => {
        const id = readText(item)
        return id ? [id] : []
      })
    : []

  return {
    id: readText(value.id),
    browser: readText(value.browser),
    os: readText(value.os),
    device: readText(value.device),
    screen: readText(value.screen),
    language: readText(value.language),
    country: readText(value.country),
    region: readText(value.region),
    city: readText(value.city),
    firstAt: readText(value.firstAt),
    lastAt: readText(value.lastAt),
    visits: readCount(value.visits),
    views: readCount(value.views),
    distinctIds,
  }
}

function readSessions(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const session = readSession(item)
    return session ? [session] : []
  })
}

function readActivity(value: unknown): SessionPageView[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .flatMap((item) => {
      if (!isRecord(item)) {
        return []
      }

      const createdAt = readText(item.createdAt)
      if (!createdAt) {
        return []
      }

      return [
        {
          createdAt,
          urlPath: readText(item.urlPath) || "/",
          referrerDomain: readText(item.referrerDomain),
          eventName: readText(item.eventName),
        },
      ]
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

function sessionWindow(session: VisitorSession) {
  const start = Date.parse(session.firstAt)
  const end = Date.parse(session.lastAt)
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    const endAt = Date.now()
    return { startAt: endAt - rangeDays * 24 * 60 * 60 * 1000, endAt }
  }

  return { startAt: start - 60_000, endAt: Math.max(end, start) + 60_000 }
}

export async function loadVisitorSessions(): Promise<VisitorSessionsResult> {
  if (!getUmamiApiConfig()) {
    return { ok: false, error: "UMAMI_API_KEY is not set" }
  }

  const endAt = Date.now()
  const startAt = endAt - rangeDays * 24 * 60 * 60 * 1000

  try {
    const first = await umamiGet(
      "/sessions",
      new URLSearchParams({
        startAt: String(startAt),
        endAt: String(endAt),
        page: "1",
        pageSize: String(pageSize),
      }),
    )
    const total = isRecord(first) ? readCount(first.count) : 0
    const sessions = readSessions(isRecord(first) ? first.data : null)
    const pageCount = Math.min(Math.ceil(total / pageSize), maxPages)

    if (pageCount > 1) {
      const rest = await Promise.all(
        Array.from({ length: pageCount - 1 }, (_, index) =>
          umamiGet(
            "/sessions",
            new URLSearchParams({
              startAt: String(startAt),
              endAt: String(endAt),
              page: String(index + 2),
              pageSize: String(pageSize),
            }),
          ),
        ),
      )
      for (const page of rest) {
        sessions.push(...readSessions(isRecord(page) ? page.data : null))
      }
    }

    sessions.sort((left, right) => right.lastAt.localeCompare(left.lastAt))

    return { ok: true, data: { sessions, total } }
  } catch (error) {
    return { ok: false, error: umamiFailure(error) }
  }
}

export async function loadVisitorSession(sessionId: string): Promise<VisitorSessionResult> {
  if (!getUmamiApiConfig()) {
    return { ok: false, error: "UMAMI_API_KEY is not set" }
  }

  if (!visitorSessionIdPattern.test(sessionId)) {
    return { ok: false, error: "Session not found" }
  }

  try {
    const body = await umamiGet(`/sessions/${encodeURIComponent(sessionId)}`, new URLSearchParams())
    const session = readSession(body)
    if (!session) {
      return { ok: false, error: "Session not found" }
    }

    const window = sessionWindow(session)
    const activity = await umamiGet(
      `/sessions/${encodeURIComponent(sessionId)}/activity`,
      new URLSearchParams({
        startAt: String(window.startAt),
        endAt: String(window.endAt),
      }),
    )

    return { ok: true, data: { session, activity: readActivity(activity) } }
  } catch (error) {
    return { ok: false, error: umamiFailure(error) }
  }
}
