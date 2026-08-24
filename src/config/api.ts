export const localDevApiUrl = "http://localhost:9998"

export function getApiUrl() {
  if (process.env.API_URL) {
    return process.env.API_URL
  }

  if (process.env.NODE_ENV === "development") {
    return localDevApiUrl
  }

  return undefined
}
