"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowLeft, ChevronDownIcon, LoaderCircle, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field as DateField, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getAdminArticle,
  previewAdminArticle,
  publishAdminArticle,
  saveAdminArticleDraft,
  saveAdminArticleSettings,
  unpublishAdminArticle,
  updateAdminArticlePublishedAt,
} from "@/features/admin/articles/articles-api"
import type { AdminArticleDetail, ArticleAudience, ArticleContentType } from "@/features/admin/articles/types"
import { useEditorActionsSlot } from "@/features/admin/components/admin-header"
import { notifyFailure, notifySuccess } from "@/features/admin/components/notify"
import { NoteTagsField } from "@/features/admin/articles/components/note-tags-field"
import { sameTags } from "@/features/admin/articles/tags"
import { fileUrl, uploadFile } from "@/features/admin/files/files-api"
import { isPreviewableImage } from "@/features/admin/files/types"
import { formatDate } from "@/lib/datetime"

const noteEditorFormId = "note-editor-form"
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const maxMarkdownBytes = 1024 * 1024

const audiences: { label: string; value: ArticleAudience }[] = [
  { label: "public", value: "public" },
  { label: "users", value: "user" },
  { label: "admin", value: "admin" },
]

function markdownToSave(contentType: ArticleContentType, edited: string) {
  return contentType === "markdown" ? edited : ""
}

function isCoverImage(file: File) {
  return file.type !== "image/svg+xml" && (isPreviewableImage(file.name) || file.type.startsWith("image/"))
}

const publishStartMonth = new Date(2000, 0, 1)
const publishEndMonth = new Date(new Date().getFullYear() + 10, 11, 31)
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"))

function toTimeValue(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function combinePublishTime(date: Date, time: string) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time)
  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  const second = Number(match[3] ?? "0")
  if (hour > 23 || minute > 59 || second > 59) {
    return null
  }

  const next = new Date(date)
  next.setHours(hour, minute, second, 0)
  return Number.isNaN(next.getTime()) ? null : next
}

function isSamePublishTime(saved: string | null, date: Date | undefined, time: string) {
  const next = date ? combinePublishTime(date, time) : null
  if (!saved) {
    return !date && time === ""
  }

  const savedDate = new Date(saved)
  if (Number.isNaN(savedDate.getTime()) || !next) {
    return false
  }

  return savedDate.getTime() === next.getTime()
}

function TimeSelect({
  id,
  value,
  disabled = false,
  onChange,
}: {
  id: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const [hour = "", minute = "", second = ""] = value.split(":")

  function update(nextHour: string, nextMinute: string, nextSecond: string) {
    onChange(`${nextHour}:${nextMinute}:${nextSecond}`)
  }

  return (
    <div className="flex w-full items-center gap-1">
      <TimePart
        id={id}
        label="Hour"
        value={hour}
        options={hours}
        disabled={disabled}
        onChange={(next) => update(next, minute || "00", second || "00")}
      />
      <span className="text-muted-foreground" aria-hidden="true">
        :
      </span>
      <TimePart
        label="Minute"
        value={minute}
        options={minutes}
        disabled={disabled}
        onChange={(next) => update(hour || "00", next, second || "00")}
      />
      <span className="text-muted-foreground" aria-hidden="true">
        :
      </span>
      <TimePart
        label="Second"
        value={second}
        options={minutes}
        disabled={disabled}
        onChange={(next) => update(hour || "00", minute || "00", next)}
      />
    </div>
  )
}

interface NoteForm {
  article: AdminArticleDetail | null
  title: string
  slug: string
  contentType: ArticleContentType
  audience: ArticleAudience
  tags: string[]
  summary: string
  markdown: string
  coverFileKey: string
  coverFile: File | null
  coverPreviewUrl: string
  publishDate: Date | undefined
  publishTime: string
}

const emptyForm: NoteForm = {
  article: null,
  title: "",
  slug: "",
  contentType: "markdown",
  audience: "public",
  tags: [],
  summary: "",
  markdown: "",
  coverFileKey: "",
  coverFile: null,
  coverPreviewUrl: "",
  publishDate: undefined,
  publishTime: "",
}

function formFromArticle(next: AdminArticleDetail): NoteForm {
  const publishedAt = next.publishedAt ? new Date(next.publishedAt) : null
  const validPublishedAt = publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null

  return {
    article: next,
    title: next.draft.title,
    slug: next.slug,
    contentType: next.contentType,
    audience: next.audience,
    tags: next.tags,
    summary: next.draft.summary,
    markdown: next.draft.markdown,
    coverFileKey: next.draft.coverFileKey,
    coverFile: null,
    coverPreviewUrl: "",
    publishDate: validPublishedAt ?? undefined,
    publishTime: validPublishedAt ? toTimeValue(validPublishedAt) : "",
  }
}

function TimePart({
  id,
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  id?: string
  label: string
  value: string
  options: string[]
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <Select
      value={value || null}
      disabled={disabled}
      onValueChange={(next) => {
        if (next) {
          onChange(next)
        }
      }}
    >
      <SelectTrigger id={id} aria-label={label} className="w-auto min-w-0 flex-1 px-1.5 [&_svg]:size-3">
        <SelectValue placeholder="--" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function NoteEditor({ articleId }: { articleId: string }) {
  const [form, setForm] = useState<NoteForm>(emptyForm)
  const {
    article,
    title,
    slug,
    contentType,
    audience,
    tags,
    summary,
    markdown,
    coverFileKey,
    coverFile,
    coverPreviewUrl,
    publishDate,
    publishTime,
  } = form
  const coverPreviewRef = useRef("")
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [publishDateOpen, setPublishDateOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const editorActionsSlot = useEditorActionsSlot()

  function updateForm(patch: Partial<NoteForm>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function applyArticle(next: AdminArticleDetail) {
    if (coverPreviewRef.current) {
      URL.revokeObjectURL(coverPreviewRef.current)
      coverPreviewRef.current = ""
    }
    setForm(formFromArticle(next))
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadArticle() {
      setIsLoading(true)
      setError("")

      try {
        applyArticle(await getAdminArticle(articleId, controller.signal))
      } catch (requestError) {
        if (controller.signal.aborted) {
          return
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load the note")
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadArticle()

    return () => controller.abort()
  }, [articleId])

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) {
        URL.revokeObjectURL(coverPreviewRef.current)
      }
    }
  }, [])

  const locked = article?.status === "published"
  const fieldsDirty =
    article !== null &&
    (title !== article.draft.title ||
      slug !== article.slug ||
      contentType !== article.contentType ||
      audience !== article.audience ||
      !sameTags(tags, article.tags) ||
      summary !== article.draft.summary ||
      markdown !== article.draft.markdown ||
      !isSamePublishTime(article.publishedAt, publishDate, publishTime))
  const coverDirty = coverFile !== null

  async function runAction(action: string, task: () => Promise<void>) {
    setPendingAction(action)
    setError("")
    setMessage("")

    try {
      await task()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "The request failed"
      if (action === "save") {
        notifyFailure("保存失败", message)
      } else {
        setError(message)
      }
    } finally {
      setPendingAction("")
    }
  }

  function validateDraft() {
    const nextSlug = slug.trim().toLowerCase()
    if (!slugPattern.test(nextSlug) || nextSlug.length > 200) {
      return "Slug must use lowercase letters, numbers, and hyphens."
    }
    if ([...title.trim()].length > 200) {
      return "Title must be 200 characters or fewer."
    }
    if ([...summary.trim()].length > 1000) {
      return "Summary must be 1000 characters or fewer."
    }
    if (!locked && contentType === "frontend" && article?.draft.markdown.trim()) {
      return "已有 Markdown 不会被修改。"
    }
    if (contentType === "markdown" && new TextEncoder().encode(markdown).byteLength > maxMarkdownBytes) {
      return "Markdown must be 1 MiB or smaller."
    }

    return ""
  }

  function draftInput(coverKey: string) {
    return {
      slug: slug.trim().toLowerCase(),
      contentType,
      audience,
      tags,
      title: title.trim(),
      summary: summary.trim(),
      markdown: markdownToSave(contentType, markdown),
      coverFileKey: coverKey,
      expectedVersion: article?.draft.version ?? 1,
    }
  }

  async function commitPublishedAt(current: AdminArticleDetail, publishedAt: Date | null, writeBackOnFailure: boolean) {
    if (!article || !publishedAt || isSamePublishTime(article.publishedAt, publishDate, publishTime)) {
      return current
    }

    try {
      return await updateAdminArticlePublishedAt(current.id, publishedAt.toISOString())
    } catch (requestError) {
      if (writeBackOnFailure) {
        applyArticle(current)
      }
      throw requestError
    }
  }

  if (isLoading) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Loading note
      </p>
    )
  }

  if (!article) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error || "Failed to load the note"}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/notes"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Notes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{title.trim() || "Untitled"}</h1>
          <Badge variant={article.status === "published" ? "default" : "secondary"}>
            {article.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {locked ? (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Unpublish this note before editing the title, summary, content, or cover.
        </p>
      ) : null}

      <form
        id={noteEditorFormId}
        className="grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-8"
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.id === "note-tags") {
            event.preventDefault()
          }
        }}
        onSubmit={(event) => {
          event.preventDefault()
          if (document.activeElement instanceof HTMLElement && document.activeElement.id === "note-tags") {
            return
          }
          const validationError = validateDraft()
          if (validationError) {
            notifyFailure("保存失败", validationError)
            return
          }

          const hasPublishInput = Boolean(publishDate) || publishTime !== ""
          const nextPublishedAt = publishDate ? combinePublishTime(publishDate, publishTime) : null
          if (hasPublishInput && !nextPublishedAt) {
            notifyFailure("保存失败", "Choose a publish time.")
            return
          }

          void runAction("save", async () => {
            if (locked) {
              const settingsChanged =
                slug.trim().toLowerCase() !== article.slug ||
                audience !== article.audience ||
                !sameTags(tags, article.tags)
              const savedSettings = settingsChanged
                ? await saveAdminArticleSettings(article.id, {
                    slug: slug.trim().toLowerCase(),
                    audience,
                    tags,
                    expectedVersion: article.draft.version,
                  })
                : article
              applyArticle(await commitPublishedAt(savedSettings, nextPublishedAt, settingsChanged))
              notifySuccess("保存成功")
              return
            }

            let key = coverFileKey
            if (coverFile) {
              key = (await uploadFile(coverFile)).key
            }
            const saved = await saveAdminArticleDraft(article.id, draftInput(key))
            applyArticle(await commitPublishedAt(saved, nextPublishedAt, true))
            notifySuccess("保存成功")
          })
        }}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <Field label="Title" htmlFor="note-title">
            <Input
              id="note-title"
              value={title}
              disabled={locked}
              onChange={(event) => updateForm({ title: event.target.value })}
            />
          </Field>
          <Field label="Summary" htmlFor="note-summary">
            <Textarea
              id="note-summary"
              value={summary}
              disabled={locked}
              onChange={(event) => updateForm({ summary: event.target.value })}
            />
          </Field>
          <Field label="Content type" htmlFor="note-content-type">
            <Select
              value={contentType}
              disabled={locked}
              onValueChange={(value) => {
                if (value === "markdown" || value === "frontend") {
                  updateForm({ contentType: value })
                }
              }}
            >
              <SelectTrigger id="note-content-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">markdown</SelectItem>
                <SelectItem value="frontend">frontend</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Markdown" htmlFor="note-markdown">
            <Textarea
              id="note-markdown"
              value={markdown}
              disabled={locked || contentType !== "markdown"}
              className="min-h-72 font-mono"
              onChange={(event) => updateForm({ markdown: event.target.value })}
            />
            <p className="text-sm text-muted-foreground">frontend 只管理权限。已有 Markdown 不会被改写。</p>
          </Field>
        </div>
        <aside className="sticky top-20 flex max-h-[calc(100svh-6rem)] flex-col gap-4 overflow-y-auto border-s ps-6">
          <Field label="Cover" htmlFor="note-cover">
            <input
              id="note-cover"
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp,image/x-icon,.ico"
              className="sr-only"
              disabled={locked}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (!file) {
                  return
                }
                if (!isCoverImage(file)) {
                  setError("Choose a PNG, JPEG, GIF, WebP, AVIF, BMP, or ICO image.")
                  return
                }
                if (coverPreviewRef.current) {
                  URL.revokeObjectURL(coverPreviewRef.current)
                }
                const url = URL.createObjectURL(file)
                coverPreviewRef.current = url
                updateForm({ coverFile: file, coverPreviewUrl: url })
                setError("")
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={locked}
              onClick={() => coverInputRef.current?.click()}
            >
              <Upload aria-hidden="true" className="size-4" />
              {coverPreviewUrl || coverFileKey ? "Replace image" : "Choose image"}
            </Button>
            {coverPreviewUrl || coverFileKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreviewUrl || fileUrl(coverFileKey)}
                alt=""
                className="max-h-72 w-full rounded-lg border object-contain"
              />
            ) : null}
          </Field>
          <Field label="Audience" htmlFor="note-audience">
            <Select
              value={audience}
              onValueChange={(value) => {
                if (value === "public" || value === "user" || value === "admin") {
                  updateForm({ audience: value })
                }
              }}
            >
              <SelectTrigger id="note-audience" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tags" htmlFor="note-tags">
            <NoteTagsField
              id="note-tags"
              tags={tags}
              onChange={(nextTags) => updateForm({ tags: nextTags })}
            />
          </Field>
          <DateField>
            <FieldLabel htmlFor="note-published-date">Date</FieldLabel>
            <Popover open={publishDateOpen} onOpenChange={setPublishDateOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    id="note-published-date"
                    data-empty={!publishDate}
                    className="w-full justify-between font-normal data-[empty=true]:text-muted-foreground"
                  >
                    {publishDate ? formatDate(publishDate) : "Select date"}
                    <ChevronDownIcon data-icon="inline-end" />
                  </Button>
                }
              />
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={publishDate}
                  captionLayout="dropdown"
                  startMonth={publishStartMonth}
                  endMonth={publishEndMonth}
                  defaultMonth={publishDate}
                  onSelect={(date) => {
                    updateForm({ publishDate: date })
                    setPublishDateOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </DateField>
          <DateField>
            <FieldLabel htmlFor="note-published-time">Time</FieldLabel>
            <TimeSelect
              id="note-published-time"
              value={publishTime}
              onChange={(value) => updateForm({ publishTime: value })}
            />
          </DateField>
          <Field label="Slug" htmlFor="note-slug">
            <Input
              id="note-slug"
              value={slug}
              onChange={(event) => updateForm({ slug: event.target.value })}
            />
          </Field>
          {editorActionsSlot
            ? createPortal(
                <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-zinc-950 p-1 text-white shadow-lg">
                  <Button
                    type="submit"
                    form={noteEditorFormId}
                    size="sm"
                    className="rounded-full bg-zinc-800 text-white hover:bg-zinc-700"
                    disabled={pendingAction !== ""}
                  >
                    {pendingAction === "save" ? "Saving…" : locked ? "Save" : "Save draft"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-zinc-800 text-white hover:bg-zinc-700"
                    disabled={pendingAction !== "" || contentType !== "markdown" || !markdown.trim()}
                    onClick={() =>
                      void runAction("preview", async () => {
                        setPreviewHtml(await previewAdminArticle(article.id, markdown))
                        setPreviewOpen(true)
                      })
                    }
                  >
                    {pendingAction === "preview" ? "Previewing…" : "Preview"}
                  </Button>
                  {locked ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200"
                      disabled={pendingAction !== ""}
                      onClick={() =>
                        void runAction("unpublish", async () => {
                          applyArticle(await unpublishAdminArticle(article.id))
                          setMessage("Note unpublished.")
                        })
                      }
                    >
                      {pendingAction === "unpublish" ? "Unpublishing…" : "Unpublish"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200"
                      disabled={
                        pendingAction !== "" ||
                        fieldsDirty ||
                        !article.publishedAt ||
                        !title.trim() ||
                        (contentType === "markdown" && !markdown.trim())
                      }
                      onClick={() => {
                        const hasPublishInput = Boolean(publishDate) || publishTime !== ""
                        const nextPublishedAt = publishDate ? combinePublishTime(publishDate, publishTime) : null
                        if (coverDirty) {
                          const validationError = validateDraft()
                          if (validationError) {
                            setError(validationError)
                            return
                          }
                          if (hasPublishInput && !nextPublishedAt) {
                            setError("Choose a publish time.")
                            return
                          }
                        }

                        void runAction("publish", async () => {
                          let current = article
                          if (coverFile) {
                            const key = (await uploadFile(coverFile)).key
                            const saved = await saveAdminArticleDraft(article.id, draftInput(key))
                            current = await commitPublishedAt(saved, nextPublishedAt, true)
                          }
                          try {
                            current = await publishAdminArticle(current.id)
                          } catch (requestError) {
                            if (current !== article) {
                              applyArticle(current)
                            }
                            throw requestError
                          }
                          applyArticle(current)
                          setMessage("Note published.")
                        })
                      }}
                    >
                      {pendingAction === "publish" ? "Publishing…" : "Publish"}
                    </Button>
                  )}
                </div>,
                editorActionsSlot,
              )
            : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </aside>
      </form>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="pr-8">Preview</DialogTitle>
            <DialogDescription className="sr-only">Rendered note preview</DialogDescription>
          </DialogHeader>
          {previewHtml ? (
            <div className="note-body max-h-[70vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
