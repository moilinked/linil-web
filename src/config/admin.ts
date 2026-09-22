export function getAdminUsers() {
  return (process.env.ADMIN_USERS ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
}

export function isAdminName(name: string | undefined) {
  if (!name) {
    return false
  }

  return getAdminUsers().includes(name)
}
