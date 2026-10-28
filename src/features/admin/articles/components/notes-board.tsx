"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, LoaderCircle, Trash2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { tagLabel } from "@/features/admin/articles/tags"
import type {
  AdminArticle,
  ArticleAudience,
  ArticleSort,
  ArticleSortOrder,
  ArticleStatus,
} from "@/features/admin/articles/types"
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
        <div className="flex flex-col gap-3">
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
  const title = note.title || "Untitled"

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Link
        href={`/admin/notes/${note.id}`}
        className="flex min-w-0 flex-1 flex-col gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant={note.status === "published" ? "default" : "secondary"}
            className={note.status === "draft" ? "bg-chart-3 text-background" : undefined}
          >
            {statusLabels[note.status]}
          </Badge>
          <span>{audienceLabels[note.audience]}</span>
          <time dateTime={note.updatedAt}>{formatUpdatedAt(note.updatedAt)}</time>
        </div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {note.slug ? <p className="truncate text-xs text-muted-foreground">{note.slug}</p> : null}
        {note.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/80">
                {tagLabel(tag)}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        aria-label={`删除 ${title}`}
        onClick={() => onDelete(note)}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
