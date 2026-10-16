import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const COMPACT_BREAKPOINT = 1024
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
const COMPACT_QUERY = `(max-width: ${COMPACT_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia(MOBILE_QUERY)
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function subscribeCompact(onStoreChange: () => void) {
  const media = window.matchMedia(COMPACT_QUERY)
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function getCompactSnapshot() {
  return window.innerWidth < COMPACT_BREAKPOINT
}

function getCompactServerSnapshot() {
  return false
}

export function useIsCompact() {
  return useSyncExternalStore(subscribeCompact, getCompactSnapshot, getCompactServerSnapshot)
}
