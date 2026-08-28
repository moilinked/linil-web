import type { Metadata } from "next"

import { ContentPlaceholder } from "@/components/content/content-placeholder"

export const metadata: Metadata = {
  title: "Notes",
  description: "Notes on development, AI agents, and project practice",
}

export default function NotesPage() {
  return (
    <ContentPlaceholder
      eyebrow="Notes"
      title="Learning Notes"
      description="This space will organize development practices, AI agent concepts, and project learnings. The content system will be added after the Chat MVP is complete."
    />
  )
}
