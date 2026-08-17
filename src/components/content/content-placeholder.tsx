interface ContentPlaceholderProps {
  eyebrow: string
  title: string
  description: string
}

export function ContentPlaceholder({ eyebrow, title, description }: ContentPlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
