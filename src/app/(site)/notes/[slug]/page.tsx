import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NoteArticle } from "@/features/notes/components/note-article"
import { getPublishedNote } from "@/features/notes/get-published-note"
import { highlightNoteHtml, highlightNoteMarkdown } from "@/features/notes/highlight-note"
import { readLocalNote } from "@/features/notes/local-note"
import { noteSlugPattern } from "@/features/notes/types"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (!noteSlugPattern.test(slug)) {
    return { title: "Note" }
  }

  try {
    const note = await getPublishedNote(slug)
    if (!note) {
      return { title: "Note" }
    }

    return {
      title: note.title || "Untitled",
      description: note.summary || undefined,
    }
  } catch {
    return { title: "Note" }
  }
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!noteSlugPattern.test(slug)) {
    notFound()
  }

  const note = await getPublishedNote(slug)
  if (!note) {
    notFound()
  }

  const html =
    note.contentType === "frontend"
      ? await highlightNoteMarkdown((await readLocalNote(slug)) ?? "")
      : await highlightNoteHtml(note.html)

  return <NoteArticle note={note} html={html} />
}
