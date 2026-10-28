"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText } from "lucide-react"

import { PageLoading } from "@/components/content/page-loading"
import { Button } from "@/components/ui/button"
import { fileUrl } from "@/features/admin/files/files-api"
import { tagLabel } from "@/features/admin/articles/tags"
import { listNotes } from "@/features/notes/notes-api"
import type { PublicNote } from "@/features/notes/types"
import { formatDate } from "@/lib/datetime"

export function NotesReading({ tag = "" }: { tag?: string }) {
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
        const page = await listNotes({ tag, signal: controller.signal })
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
  }, [tag])

  async function loadMore() {
    setIsLoadingMore(true)
    setError("")

    try {
      const page = await listNotes({ after: endCursor, tag })
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
    return <PageLoading label="Loading notes" />
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tag ? "No notes with this tag." : "No notes yet."}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <ReadingCard key={note.id} note={note} featured={false} />
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
            ? "flex flex-col gap-6 rounded-2xl border border-border bg-card/90 p-6 shadow-(--shadow-panel) transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-panel-strong)] sm:p-8"
            : "flex flex-col gap-5 rounded-2xl border border-border bg-card/80 p-5 shadow-(--shadow-panel) transition duration-200 group-hover:-translate-y-1 group-hover:bg-card group-hover:shadow-[var(--shadow-panel-strong)]"
        }
      >
        <div
          className={
            featured
              ? "flex flex-col gap-6 md:flex-row md:items-stretch"
              : "flex flex-col gap-5 sm:flex-row sm:items-stretch"
          }
        >
          <div className="flex min-w-0 flex-1 flex-col">
            {publishedAt || note.hasPdf ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {publishedAt ? <time dateTime={note.publishedAt}>{publishedAt}</time> : null}
                {note.hasPdf ? (
                  <span className="inline-flex items-center gap-1">
                    <FileText aria-hidden="true" className="size-3.5" />
                    PDF
                  </span>
                ) : null}
              </div>
            ) : null}
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
        </div>
        {note.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/80">
                {tagLabel(tag)}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </Link>
  )
}
