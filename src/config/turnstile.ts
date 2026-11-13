import "server-only"

const defaultSiteKey = "0x4AAAAAAF8MidLS6BmCnIDI"
const developmentSiteKey = "1x00000000000000000000AA"

export function getTurnstileSiteKey() {
  const configured = process.env.TURNSTILE_SITE_KEY?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  if (configured) {
    return configured
  }

  if (process.env.NODE_ENV === "development" && !getTurnstileSecret()) {
    return developmentSiteKey
  }

  return defaultSiteKey
}

export function getTurnstileSecret() {
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? ""
}
