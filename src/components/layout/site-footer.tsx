import { siteConfig } from "@/config/site"

export function SiteFooter() {
  return (
    <footer className="shrink-0 px-3 py-2 sm:px-6">
      <p className="text-center text-xs text-muted-foreground">
        <a
          href={siteConfig.beian.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {siteConfig.beian.number}
        </a>
      </p>
    </footer>
  )
}
