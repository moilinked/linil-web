import type { Metadata } from "next"

import { ContentPlaceholder } from "@/components/content/content-placeholder"

export const metadata: Metadata = {
  title: "Works",
  description: "A collection of websites, tools, and experiments",
}

export default function WorksPage() {
  return (
    <ContentPlaceholder
      eyebrow="Works"
      title="Selected Works"
      description="This space will showcase websites, small tools, and experiments, documenting the full journey from idea and design to implementation."
    />
  )
}
