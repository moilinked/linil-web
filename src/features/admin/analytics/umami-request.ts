import "server-only"

import { getUmamiApiConfig } from "@/config/umami"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function umamiErrorMessage(body: unknown, status: number) {
  if (isRecord(body) && isRecord(body.error) && typeof body.error.message === "string") {
    return body.error.message
  }

  return `Umami request failed (${status})`
}

export async function umamiGet(path: string, params: URLSearchParams) {
  const config = getUmamiApiConfig()
  if (!config) {
    throw new Error("UMAMI_API_KEY is not set")
  }

  const query = params.size > 0 ? `?${params}` : ""
  const response = await fetch(`${config.apiUrl}/api/websites/${encodeURIComponent(config.websiteId)}${path}${query}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(umamiErrorMessage(body, response.status))
  }

  return body
}

export function umamiFailure(error: unknown) {
  if (error instanceof Error && error.name === "TimeoutError") {
    return "Umami request timed out"
  }

  return error instanceof Error ? error.message : "Umami request failed"
}
