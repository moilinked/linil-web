"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { fileUrl } from "@/features/admin/files/files-api"
import { tagLabel } from "@/features/admin/articles/tags"
import { listNotes } from "@/features/notes/notes-api"
import type { PublicNote } from "@/features/notes/types"
import { formatDate } from "@/lib/datetime"

export function NotesReading() {
  const [notes, setNotes] = useState<PublicNote[]>([])
  const [endCursor, setEndCursor] = useState("")
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()

    async function loadNotes() {
      setIsLoading(true)
      setError("")

      try {
        const page = await listNotes({ signal: controller.signal })
        setNotes(page.items)
        setEndCursor(page.endCursor)
        setHasNextPage(page.hasNextPage)
      } catch (requestError) {
        if (controller.signal.aborted) {
          return
        }

        setNotes([])
        setEndCursor("")
        setHasNextPage(false)
        setError(requestError instanceof Error ? requestError.message : "Failed to load notes")
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadNotes()

    return () => controller.abort()
  }, [])

  async function loadMore() {
    setIsLoadingMore(true)
    setError("")

    try {
      const page = await listNotes({ after: endCursor })
      setNotes((current) => [...current, ...page.items])
      setEndCursor(page.endCursor)
      setHasNextPage(page.hasNextPage)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load notes")
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (isLoading) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Loading notes
      </p>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note, index) => (
            <ReadingCard key={note.id} note={note} featured={index === 0} />
          ))}
        </div>
      )}
      {hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="self-center"
          disabled={isLoadingMore}
          onClick={() => void loadMore()}
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  )
}

function ReadingCard({ note, featured }: { note: PublicNote; featured: boolean }) {
  const [coverFailed, setCoverFailed] = useState(false)
  const title = note.title || "Untitled"
  const publishedAt = formatDate(note.publishedAt)
  const showCover = Boolean(note.coverFileKey) && !coverFailed

  return (
    <Link
      href={`/notes/${note.slug}`}
      className="group block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <article
        className={
          featured
            ? "flex flex-col gap-6 rounded-2xl border border-border bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_0_28px_color-mix(in_srgb,var(--primary)_45%,transparent)] sm:p-8 md:flex-row md:items-stretch"
            : "flex flex-col gap-5 rounded-2xl border border-border bg-card/60 p-5 transition duration-200 group-hover:-translate-y-1 group-hover:bg-card group-hover:shadow-[0_0_28px_color-mix(in_srgb,var(--primary)_45%,transparent)] sm:flex-row sm:items-stretch"
        }
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-foreground/80">
                {tagLabel(tag)}
              </span>
            ))}
            {publishedAt ? <time dateTime={note.publishedAt}>{publishedAt}</time> : null}
            {note.hasPdf ? (
              <span className="inline-flex items-center gap-1">
                <FileText aria-hidden="true" className="size-3.5" />
                PDF
              </span>
            ) : null}
          </div>
          <h2
            className={
              featured
                ? "mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
                : "mt-3 text-lg font-semibold tracking-tight text-balance"
            }
          >
            {title}
          </h2>
          {note.summary ? (
            <p
              className={
                featured
                  ? "mt-3 line-clamp-4 max-w-2xl text-sm leading-7 text-muted-foreground"
                  : "mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground"
              }
            >
              {note.summary}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">这篇笔记没有摘要。</p>
          )}
        </div>
        {showCover ? (
          <div
            className={
              featured
                ? "relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl bg-muted md:aspect-auto md:w-56"
                : "relative hidden aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:block"
            }
          >
            <Image
              src={fileUrl(note.coverFileKey)}
              alt=""
              fill
              unoptimized
              sizes={featured ? "(max-width: 768px) 100vw, 224px" : "112px"}
              className="object-cover"
              onError={() => setCoverFailed(true)}
            />
          </div>
        ) : null}
      </article>
    </Link>
  )
}
