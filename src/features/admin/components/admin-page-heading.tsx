interface AdminPageHeadingProps {
  title: string
  description: string
}

export function AdminPageHeading({ title, description }: AdminPageHeadingProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
