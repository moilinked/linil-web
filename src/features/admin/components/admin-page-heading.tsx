interface AdminPageHeadingProps {
  title: string
  description: string
}

export function AdminPageHeading({ title, description }: AdminPageHeadingProps) {
  return (
    <div className="rounded-[24px] border border-border bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-[12px] sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
