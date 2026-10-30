import "server-only"

const defaultApiUrl = "https://analytics.oilinil.cn"
const defaultWebsiteId = "8258e751-f426-4e49-8d9d-25b71fb7112a"

function umamiApiUrl() {
  return (process.env.UMAMI_API_URL?.trim() || defaultApiUrl).replace(/\/$/, "")
}

function umamiWebsiteId() {
  return process.env.UMAMI_WEBSITE_ID?.trim() || defaultWebsiteId
}

export function getUmamiTracking() {
  const apiUrl = umamiApiUrl()

  return {
    scriptSrc: `${apiUrl}/script.js`,
    websiteId: umamiWebsiteId(),
  }
}

export function getUmamiApiConfig() {
  const apiKey = process.env.UMAMI_API_KEY?.trim()
  if (!apiKey) {
    return null
  }

  return {
    apiUrl: umamiApiUrl(),
    apiKey,
    websiteId: umamiWebsiteId(),
  }
}
