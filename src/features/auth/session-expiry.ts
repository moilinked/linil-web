type SessionExpiredListener = () => void

const listeners = new Set<SessionExpiredListener>()

export function subscribeSessionExpired(listener: SessionExpiredListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifySessionExpired() {
  for (const listener of listeners) {
    listener()
  }
}

export function notifyIfUnauthorized(status: number) {
  if (status === 401) {
    notifySessionExpired()
  }
}
