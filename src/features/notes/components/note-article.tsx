"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

import { fileUrl } from "@/features/admin/files/files-api"
import type { PublicNoteDetail } from "@/features/notes/types"
import { formatDate } from "@/lib/datetime"

export function NoteArticle({ note, html }: { note: PublicNoteDetail; html: string }) {
  const title = note.title || "Untitled"
  const publishedAt = formatDate(note.publishedAt)

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/notes"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Notes
      </Link>
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {publishedAt ? <time dateTime={note.publishedAt}>{publishedAt}</time> : null}
          {note.hasPdf ? (
            <a
              href={`/api/articles/${note.slug}/pdf`}
              className="inline-flex items-center gap-1 rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <FileText aria-hidden="true" className="size-3.5" />
              PDF
            </a>
          ) : null}
        </div>
        {note.summary ? <p className="text-base leading-7 text-muted-foreground">{note.summary}</p> : null}
      </header>
      {note.coverFileKey ? <NoteCover fileKey={note.coverFileKey} /> : null}
      {html ? <div className="note-body" dangerouslySetInnerHTML={{ __html: html }} /> : null}
    </article>
  )
}

function NoteCover({ fileKey }: { fileKey: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return null
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
      <Image
        src={fileUrl(fileKey)}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
