import Link from "next/link"

export function AdminForbidden() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-16 sm:px-6">
      <div className="max-w-lg">
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Access denied</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          This account does not have permission to open the admin area.
        </p>
        <Link
          href="/chat"
          className="mt-8 inline-flex rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
        >
          Back to Chat
        </Link>
      </div>
    </div>
  )
}
