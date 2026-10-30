import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"
import { ResumeEditor } from "@/features/admin/resume/components/resume-editor"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "About",
  description: "Edit the public About page",
}

export default function AdminAboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeading title="About" description="Edit the resume shown on the public About page." />
        <Link href="/about" className={cn(buttonVariants({ variant: "outline" }))}>
          View About
        </Link>
      </div>
      <ResumeEditor />
    </div>
  )
}
