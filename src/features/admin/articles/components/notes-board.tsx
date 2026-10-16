"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, FileText, LoaderCircle, StickyNote, Trash2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteAdminArticles, listAdminArticles } from "@/features/admin/articles/articles-api"
import type {
  AdminArticle,
  ArticleAudience,
  ArticleSort,
  ArticleSortOrder,
  ArticleStatus,
} from "@/features/admin/articles/types"
import { fileUrl } from "@/features/admin/files/files-api"
import { formatDate } from "@/lib/datetime"
import { cn } from "@/lib/utils"

const statusLabels: Record<ArticleStatus, string> = {
  draft: "Draft",
  published: "Published",
}

const audienceLabels: Record<ArticleAudience, string> = {
  public: "Public",
  user: "Users",
  admin: "Admin",
}

const sorts: { value: ArticleSort; label: string }[] = [
  { value: "published_at", label: "发布时间" },
  { value: "updated_at", label: "更新时间" },
  { value: "created_at", label: "创建时间" },
]

function formatUpdatedAt(value: string) {
  return formatDate(value) || "Unknown date"
}

export function NotesBoard() {
  const [notes, setNotes] = useState<AdminArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<ArticleSort>("created_at")
  const [order, setOrder] = useState<ArticleSortOrder>("desc")
  const [pendingDelete, setPendingDelete] = useState<AdminArticle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const committedSearchRef = useRef("")
  const searchTimerRef = useRef<number | null>(null)

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }
  }, [])

  const commitSearch = useCallback(
    (value: string) => {
      clearSearchTimer()
      const nextSearch = value.trim()
      if (committedSearchRef.current === nextSearch) {
        return
      }

      committedSearchRef.current = nextSearch
      setSearch(nextSearch)
    },
    [clearSearchTimer],
  )

  useEffect(() => clearSearchTimer, [clearSearchTimer])

  function handleSearchChange(value: string) {
    setSearchDraft(value)
    clearSearchTimer()
    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null
      commitSearch(value)
    }, 1000)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadNotes() {
      setIsLoading(true)
      setError("")

      try {
        setNotes(
          await listAdminArticles({
            name: search,
            sort,
            order,
            signal: controller.signal,
          }),
        )
      } catch (requestError) {
        if (controller.signal.aborted) {
          return
        }

        setNotes([])
        setError(requestError instanceof Error ? requestError.message : "Failed to load notes")
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadNotes()

    return () => controller.abort()
  }, [order, search, sort])

  async function handleConfirmDelete() {
    if (!pendingDelete || isDeleting) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const warning = await deleteAdminArticles([pendingDelete.id])
      setNotes((current) => current.filter((note) => note.id !== pendingDelete.id))
      setPendingDelete(null)
      if (warning) {
        setError(warning)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete the note")
    } finally {
      setIsDeleting(false)
    }
  }

  const emptyLabel = search ? "没有匹配的笔记" : "没有笔记"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-56">
          <Input
            value={searchDraft}
            onChange={(event) => handleSearchChange(event.target.value)}
            onBlur={(event) => commitSearch(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing) {
                return
              }

              event.preventDefault()
              commitSearch(event.currentTarget.value)
            }}
            placeholder="按标题搜索"
            aria-label="按标题搜索笔记"
            className={cn("h-8 w-full", searchDraft && "pr-8")}
          />
          {searchDraft ? (
            <button
              type="button"
              aria-label="清除搜索"
              className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setSearchDraft("")
                commitSearch("")
              }}
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          ) : null}
        </div>
        <Select
          items={sorts}
          value={sort}
          onValueChange={(value) => {
            if (value === "published_at" || value === "updated_at" || value === "created_at") {
              setSort(value)
            }
          }}
        >
          <SelectTrigger className="w-32" aria-label="排序">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          aria-label={order === "desc" ? "倒序" : "正序"}
          onClick={() => setOrder((current) => (current === "desc" ? "asc" : "desc"))}
        >
          {order === "desc" ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}
          {order === "desc" ? "倒序" : "正序"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading && notes.length === 0 ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Loading notes
        </p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingDelete(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除笔记</DialogTitle>
            <DialogDescription>{pendingDelete?.title || "Untitled"} 会被删除，封面文件会保留。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setPendingDelete(null)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting ? "删除中…" : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NoteCard({ note, onDelete }: { note: AdminArticle; onDelete: (note: AdminArticle) => void }) {
  const [coverFailed, setCoverFailed] = useState(false)
  const title = note.title || "Untitled"
  const showCover = Boolean(note.coverFileKey) && !coverFailed
  const publishedAt = formatDate(note.publishedAt)

  return (
    <div className="relative h-full">
      <Link
        href={`/admin/notes/${note.id}`}
        className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Card className="h-full pt-0 transition-colors hover:bg-muted/30">
          <div className="relative aspect-[16/10] bg-muted">
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
            <CardDescription className="line-clamp-3 min-h-15">{note.summary || "No summary"}</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant={note.status === "published" ? "default" : "secondary"}>{statusLabels[note.status]}</Badge>
              <Badge variant="outline">{audienceLabels[note.audience]}</Badge>
              {note.hasPdf ? (
                <Badge variant="outline">
                  <FileText aria-hidden="true" />
                  PDF
                </Badge>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
              <time dateTime={note.updatedAt}>更新 {formatUpdatedAt(note.updatedAt)}</time>
              {note.publishedAt && publishedAt ? <time dateTime={note.publishedAt}>发布 {publishedAt}</time> : null}
            </div>
          </CardFooter>
        </Card>
      </Link>
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className="absolute top-2 right-2 z-10 bg-background/90"
        aria-label={`删除 ${title}`}
        onClick={() => onDelete(note)}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
