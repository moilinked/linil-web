"use client"

import { type DragEvent, type SubmitEvent, useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, FileIcon, Link2, LoaderCircle, Trash2, Upload } from "lucide-react"

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
import { deleteFile, fileUrl, listFiles, uploadFile } from "@/features/admin/files/files-api"
import { formatFileSize, isPreviewableImage, type FileSummary } from "@/features/admin/files/types"
import { cn } from "@/lib/utils"

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function FileCard({
  file,
  isCopied,
  onCopy,
  onDelete,
}: {
  file: FileSummary
  isCopied: boolean
  onCopy: () => void
  onDelete: () => void
}) {
  const url = fileUrl(file.key)

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60">
      <div className="relative flex aspect-4/3 items-center justify-center bg-muted">
        {isPreviewableImage(file.name) ? (
          <Image
            src={url}
            alt={file.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain"
          />
        ) : (
          <FileIcon aria-hidden="true" className="size-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-medium hover:text-primary"
          title={file.name}
        >
          {file.name}
        </a>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)} · {new Date(file.last_modified).toLocaleDateString()}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Copy link" onClick={onCopy}>
            {isCopied ? (
              <Check aria-hidden="true" className="size-4 text-primary" />
            ) : (
              <Link2 aria-hidden="true" className="size-4" />
            )}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete file" onClick={onDelete}>
            <Trash2 aria-hidden="true" className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    </li>
  )
}

export function FileManager() {
  const [files, setFiles] = useState<FileSummary[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [prefixDraft, setPrefixDraft] = useState("")
  const [prefix, setPrefix] = useState("")
  const [remainingUploads, setRemainingUploads] = useState(0)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [copiedKey, setCopiedKey] = useState("")
  const [pendingDelete, setPendingDelete] = useState<FileSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => setReloadToken((current) => current + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadFirstPage() {
      setIsLoading(true)
      setError("")

      try {
        const page = await listFiles({ prefix, signal: controller.signal })
        setFiles(page.items)
        setCursor(page.end_cursor)
        setHasNextPage(page.has_next_page)
      } catch (requestError) {
        if (controller.signal.aborted) {
          return
        }

        setError(toErrorMessage(requestError, "Failed to load files"))
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadFirstPage()

    return () => {
      controller.abort()
    }
  }, [prefix, reloadToken])

  async function handleLoadMore() {
    if (!cursor || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)
    setError("")

    try {
      const page = await listFiles({ after: cursor, prefix })
      setFiles((current) => [...current, ...page.items])
      setCursor(page.end_cursor)
      setHasNextPage(page.has_next_page)
    } catch (requestError) {
      setError(toErrorMessage(requestError, "Failed to load more files"))
    } finally {
      setIsLoadingMore(false)
    }
  }

  // The backend takes one file per request, so a multi-file pick is uploaded in sequence.
  const uploadAll = useCallback(
    async (selected: File[]) => {
      if (selected.length === 0) {
        return
      }

      setError("")
      setRemainingUploads(selected.length)

      try {
        for (const file of selected) {
          await uploadFile(file)
          setRemainingUploads((current) => current - 1)
        }
      } catch (requestError) {
        setError(toErrorMessage(requestError, "Failed to upload"))
      } finally {
        setRemainingUploads(0)
        reload()
      }
    },
    [reload],
  )

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDropTarget(false)
    void uploadAll(Array.from(event.dataTransfer.files))
  }

  async function handleCopyLink(file: FileSummary) {
    try {
      await navigator.clipboard.writeText(new URL(fileUrl(file.key), window.location.origin).toString())
      setCopiedKey(file.key)
    } catch {
      setError("The browser blocked clipboard access")
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete || isDeleting) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      await deleteFile(pendingDelete.key)
      setFiles((current) => current.filter((file) => file.key !== pendingDelete.key))
      setPendingDelete(null)
    } catch (requestError) {
      setError(toErrorMessage(requestError, "Failed to delete the file"))
    } finally {
      setIsDeleting(false)
    }
  }

  function handleFilterSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setPrefix(prefixDraft.trim())
  }

  const isUploading = remainingUploads > 0

  return (
    <section className="rounded-[24px] border border-border bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-[12px] sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleFilterSubmit} className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            value={prefixDraft}
            onChange={(event) => setPrefixDraft(event.target.value)}
            placeholder="Filter by key prefix, e.g. 2026/09/"
            aria-label="Key prefix"
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={isLoading}>
            Filter
          </Button>
        </form>
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Upload aria-hidden="true" className="size-4" />
          )}
          {isUploading ? `Uploading ${remainingUploads}…` : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            void uploadAll(Array.from(event.target.files ?? []))
            event.target.value = ""
          }}
        />
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDropTarget(true)
        }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-4 rounded-2xl border border-dashed border-border p-4 transition-colors",
          isDropTarget && "border-primary bg-primary/5",
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16" role="status">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading files</span>
          </div>
        ) : files.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {prefix ? "No files match this prefix." : "No files yet. Drop files here or use Upload."}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {files.map((file) => (
              <FileCard
                key={file.key}
                file={file}
                isCopied={copiedKey === file.key}
                onCopy={() => void handleCopyLink(file)}
                onDelete={() => setPendingDelete(file)}
              />
            ))}
          </ul>
        )}
      </div>

      {hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="outline" onClick={() => void handleLoadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

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
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              {pendingDelete?.name} will be removed. Links already handed out stop working, though caches may serve it
              for up to a day.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
