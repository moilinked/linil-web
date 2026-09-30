import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"

export function ContentSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator className="my-4" />
      <div className="w-full max-w-xl">{children}</div>
    </div>
  )
}
