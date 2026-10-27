import type { Metadata } from "next"
import Link from "next/link"

import { tagLabel } from "@/features/admin/articles/tags"
import { NotesReading } from "@/features/notes/components/notes-reading"
import { readNoteTag } from "@/features/notes/note-tag"
import { cn } from "@/lib/utils"

const notesDescription = "Just some notes, not for reading, just for writing"

export async function generateMetadata({ searchParams }: PageProps<"/notes">): Promise<Metadata> {
  const tag = readNoteTag((await searchParams).tag)
  if (!tag) {
    return {
      title: "Notes",
      description: notesDescription,
    }
  }

  const label = tagLabel(tag)
  return {
    title: label,
    description: `Notes tagged ${label}`,
  }
}

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  const tag = readNoteTag((await searchParams).tag)

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 sm:py-12",
        // "lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start",
      )}
    >
      {/* <header className="flex flex-col gap-4 lg:sticky lg:top-28">
        <p className="text-sm font-medium text-muted-foreground">Notes</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">随便写写</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          一些想到哪记到哪的笔记，不专业，不是结论，也不用当成标准。如果和其他文章有冲突，请以他的为准。
        </p>
      </header> */}
      {tag ? (
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tagLabel(tag)}</h1>
          <Link href="/notes" className="text-sm text-muted-foreground hover:text-foreground">
            All notes
          </Link>
        </div>
      ) : null}
      <NotesReading tag={tag} />
    </div>
  )
}
