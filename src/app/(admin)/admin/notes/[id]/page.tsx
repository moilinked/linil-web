import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NoteEditor } from "@/features/admin/articles/components/note-editor"

export const metadata: Metadata = {
  title: "Edit note",
  description: "Edit a note",
}

export default async function AdminNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f]{32}$/.test(id)) {
    notFound()
  }

  return <NoteEditor articleId={id} />
}
