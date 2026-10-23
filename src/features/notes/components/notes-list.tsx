"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText, LoaderCircle, StickyNote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fileUrl } from "@/features/admin/files/files-api"
import { listNotes } from "@/features/notes/notes-api"
import type { PublicNote } from "@/features/notes/types"
import { formatDate } from "@/lib/datetime"

export function NotesList() {
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
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
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

function NoteCard({ note }: { note: PublicNote }) {
  const [coverFailed, setCoverFailed] = useState(false)
  const title = note.title || "Untitled"
  const showCover = Boolean(note.coverFileKey) && !coverFailed
  const publishedAt = formatDate(note.publishedAt)

  return (
    <Link
      href={`/notes/${note.slug}`}
      className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full pt-0">
        <div className="relative aspect-16/10 bg-muted">
          {showCover ? (
            <Image
              src={fileUrl(note.coverFileKey)}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <StickyNote aria-hidden="true" className="size-8" />
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          {note.summary ? <CardDescription className="line-clamp-3">{note.summary}</CardDescription> : null}
        </CardHeader>
        <CardFooter className="mt-auto justify-between gap-3">
          {note.hasPdf ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <FileText aria-hidden="true" className="size-3.5" />
              PDF
            </span>
          ) : (
            <span />
          )}
          {publishedAt ? (
            <time className="shrink-0 text-xs text-muted-foreground" dateTime={note.publishedAt}>
              {publishedAt}
            </time>
          ) : null}
        </CardFooter>
      </Card>
    </Link>
  )
}
