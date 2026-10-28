import { LoaderCircle } from "lucide-react"

export function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-16rem)] items-center justify-center" role="status">
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        {label}
      </p>
    </div>
  )
}
