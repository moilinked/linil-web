"use client"

import { type DragEvent, useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileIcon,
  Link2,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  deleteFile,
  fileUrl,
  listFiles,
  uploadFile,
  type FileSort,
  type SortOrder,
} from "@/features/admin/files/files-api"
import { formatFileSize, isPreviewableImage, type FileSummary } from "@/features/admin/files/types"
import { formatDate } from "@/lib/datetime"
import { cn } from "@/lib/utils"

const pageSizeOptions = [10, 20, 30, 50]

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function pageNumbers(current: number, total: number) {
  const windowSize = Math.min(4, total)
  const start = Math.max(1, Math.min(current - 1, total - windowSize + 1))

  return Array.from({ length: windowSize }, (_, index) => start + index)
}

export function FileManager() {
  const [files, setFiles] = useState<FileSummary[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const [remainingUploads, setRemainingUploads] = useState(0)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [copiedKey, setCopiedKey] = useState("")
  const [pendingDelete, setPendingDelete] = useState<FileSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortKey, setSortKey] = useState<FileSort | null>("last_modified")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const inputRef = useRef<HTMLInputElement>(null)
  const preservePageRef = useRef<{ page: number; pageSize: number } | null>(null)
  const searchTimerRef = useRef<number | null>(null)
  const copiedTimerRef = useRef<number | null>(null)
  const committedSearchRef = useRef("")

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
      setPageIndex(0)
    },
    [clearSearchTimer],
  )

  const reload = useCallback(() => {
    setPageIndex(0)
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => clearSearchTimer, [clearSearchTimer])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

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

    async function loadFirstPage() {
      const preserved = preservePageRef.current
      preservePageRef.current = null
      const needed = preserved === null ? 0 : (preserved.page + 1) * preserved.pageSize
      setIsLoading(true)
      setError("")

      try {
        const query = {
          name: search,
          sort: sortKey ?? undefined,
          order: sortOrder,
          signal: controller.signal,
        }
        let page = await listFiles(query)
        let items = page.items
        let nextCursor = page.end_cursor
        let more = page.has_next_page

        while (items.length < needed && more && nextCursor) {
          page = await listFiles({ ...query, after: nextCursor })
          items = items.concat(page.items)
          nextCursor = page.end_cursor
          more = page.has_next_page
        }

        if (controller.signal.aborted) {
          return
        }

        setFiles(items)
        setCursor(nextCursor)
        setHasNextPage(more)
        if (preserved !== null) {
          const nextPageCount = Math.max(1, Math.ceil(items.length / preserved.pageSize))
          setPageIndex(Math.min(preserved.page, nextPageCount - 1))
        }
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
  }, [reloadToken, search, sortKey, sortOrder])

  const pageCount = Math.max(1, Math.ceil(files.length / pageSize))
  const currentPage = Math.min(pageIndex, pageCount - 1)
  const pageFiles = files.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  async function handleLoadMore() {
    if (!cursor || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)
    setError("")

    try {
      const page = await listFiles({
        after: cursor,
        name: search,
        sort: sortKey ?? undefined,
        order: sortOrder,
      })
      setFiles((current) => [...current, ...page.items])
      setCursor(page.end_cursor)
      setHasNextPage(page.has_next_page)
    } catch (requestError) {
      setError(toErrorMessage(requestError, "Failed to load more files"))
    } finally {
      setIsLoadingMore(false)
    }
  }

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
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
      copiedTimerRef.current = window.setTimeout(() => {
        copiedTimerRef.current = null
        setCopiedKey((current) => (current === file.key ? "" : current))
      }, 3000)
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

  function refreshList() {
    preservePageRef.current = { page: pageIndex, pageSize }
    setReloadToken((current) => current + 1)
  }

  function toggleSort(key: FileSort) {
    setPageIndex(0)

    if (sortKey !== key) {
      setSortKey(key)
      setSortOrder("desc")
      return
    }

    if (sortOrder === "desc") {
      setSortOrder("asc")
      return
    }

    setSortKey(null)
    setSortOrder("desc")
  }

  async function goToPage(index: number) {
    const nextIndex = Math.max(0, index)
    const needed = (nextIndex + 1) * pageSize

    if (files.length < needed && hasNextPage) {
      await handleLoadMore()
    }

    setPageIndex(nextIndex)
  }

  const isUploading = remainingUploads > 0
  const canGoForward = currentPage < pageCount - 1 || hasNextPage

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            placeholder="输入名称搜索"
            aria-label="Search files by name"
            className={cn("h-8 w-full", searchDraft && "pr-8")}
          />
          {searchDraft ? (
            <button
              type="button"
              aria-label="Clear search"
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
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={refreshList} disabled={isLoading || isUploading}>
            <RefreshCw aria-hidden="true" className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="size-4" />
            )}
            {isUploading ? `上传中 ${remainingUploads}…` : "上传"}
          </Button>
        </div>
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
        className={cn("overflow-hidden rounded-md border", isDropTarget && "border-primary")}
      >
        <Table className="min-w-[40rem] table-fixed" aria-busy={isLoading}>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">
                <SortButton
                  label="文件大小"
                  active={sortKey === "size"}
                  order={sortOrder}
                  onClick={() => toggleSort("size")}
                />
              </TableHead>
              <TableHead className="w-36">
                <SortButton
                  label="更新日期"
                  active={sortKey === "last_modified"}
                  order={sortOrder}
                  onClick={() => toggleSort("last_modified")}
                />
              </TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <span className="inline-flex items-center gap-2 text-muted-foreground" role="status">
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    加载文件...
                  </span>
                </TableCell>
              </TableRow>
            ) : pageFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {search ? "没有找到文件。" : "没有文件。将文件拖放到这里或使用上传。"}
                </TableCell>
              </TableRow>
            ) : (
              pageFiles.map((file) => (
                <FileRow
                  key={file.key}
                  file={file}
                  copied={copiedKey === file.key}
                  onCopy={() => void handleCopyLink(file)}
                  onDelete={() => setPendingDelete(file)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value) {
                setPageSize(Number(value))
                setPageIndex(0)
              }
            }}
          >
            <SelectTrigger className="h-8 w-16" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm font-medium">每页行数</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">
            第 {currentPage + 1} 页 / 共 {pageCount} 页{hasNextPage ? "+" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Go to first page"
              disabled={currentPage === 0}
              onClick={() => void goToPage(0)}
            >
              <ChevronsLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Go to previous page"
              disabled={currentPage === 0}
              onClick={() => void goToPage(currentPage - 1)}
            >
              <ChevronLeft />
            </Button>
            {pageNumbers(currentPage + 1, pageCount).map((page) => (
              <Button
                key={page}
                type="button"
                variant={page === currentPage + 1 ? "default" : "outline"}
                size="icon"
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage + 1 ? "page" : undefined}
                onClick={() => void goToPage(page - 1)}
              >
                {page}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Go to next page"
              disabled={!canGoForward || isLoadingMore}
              onClick={() => void goToPage(currentPage + 1)}
            >
              <ChevronRight />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Go to last loaded page"
              disabled={currentPage >= pageCount - 1}
              onClick={() => void goToPage(pageCount - 1)}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
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
    </div>
  )
}

function SortButton({
  label,
  active,
  order,
  onClick,
}: {
  label: string
  active: boolean
  order: SortOrder
  onClick: () => void
}) {
  const SortIcon = active ? (order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <button type="button" className="inline-flex items-center gap-1 font-medium" onClick={onClick}>
      {label}
      <SortIcon className={cn("size-3.5", active ? "text-foreground" : "text-muted-foreground")} />
    </button>
  )
}

function FileThumbnail({ file, url }: { file: FileSummary; url: string }) {
  const [open, setOpen] = useState(false)
  const previewable = isPreviewableImage(file.name)

  return (
    <>
      <span className="group relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {previewable ? (
          <>
            <Image src={url} alt="" width={32} height={32} unoptimized className="size-8 object-cover" />
            <button
              type="button"
              aria-label={`Preview ${file.name}`}
              onClick={() => setOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ZoomIn aria-hidden="true" className="size-3.5" />
            </button>
          </>
        ) : (
          <FileIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        )}
      </span>
      {previewable ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="truncate pr-8">{file.name}</DialogTitle>
              <DialogDescription className="sr-only">Enlarged preview of {file.name}</DialogDescription>
            </DialogHeader>
            <div className="relative h-[min(70vh,720px)] w-full">
              <Image
                src={url}
                alt={file.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

function FileRow({
  file,
  copied,
  onCopy,
  onDelete,
}: {
  file: FileSummary
  copied: boolean
  onCopy: () => void
  onDelete: () => void
}) {
  const url = fileUrl(file.key)

  return (
    <TableRow>
      <TableCell className="overflow-hidden">
        <div className="flex min-w-0 items-center gap-3">
          <FileThumbnail file={file} url={url} />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-medium hover:underline"
            title={file.name}
          >
            {file.name}
          </a>
        </div>
      </TableCell>
      <TableCell>{formatFileSize(file.size)}</TableCell>
      <TableCell>{formatDate(file.last_modified) || "Unknown date"}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Copy link" onClick={onCopy}>
            {copied ? (
              <Check aria-hidden="true" className="size-4 text-primary" />
            ) : (
              <Link2 aria-hidden="true" className="size-4" />
            )}
          </Button>
          {isPreviewableImage(file.name) ? (
            <Button
              nativeButton={false}
              render={<a href={url} download={file.name} />}
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${file.name}`}
            >
              <Download aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete file" onClick={onDelete}>
            <Trash2 aria-hidden="true" className="size-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
