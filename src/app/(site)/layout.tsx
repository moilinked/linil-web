import { SiteHeader } from "@/components/layout/site-header"

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1">{children}</main>
    </div>
  )
}
