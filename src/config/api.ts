export type BackendService = "chat" | "site"

const localDevUrls: Record<BackendService, string> = {
  chat: "http://localhost:9998",
  site: "http://localhost:9997",
}

const envNames: Record<BackendService, string> = {
  chat: "CHAT_API_URL",
  site: "SITE_API_URL",
}

export function backendConfigName(service: BackendService) {
  return envNames[service]
}

export function getBackendBaseUrl(service: BackendService) {
  const configured = process.env[envNames[service]]?.trim()
  if (configured) {
    return configured
  }

  if (service === "chat") {
    const legacy = process.env.API_URL?.trim()
    if (legacy) {
      return legacy
    }
  }

  if (process.env.NODE_ENV === "development") {
    return localDevUrls[service]
  }

  return undefined
}

export function backendServiceForApiPath(pathname: string): BackendService | null {
  const segments = pathname.split("/").filter(Boolean)
  if (segments[0] !== "api") {
    return null
  }

  const root = segments[1]
  if (root === "auth" || root === "users") {
    return "site"
  }
  if (root === "conversations" || root === "chat") {
    return "chat"
  }

  return null
}
