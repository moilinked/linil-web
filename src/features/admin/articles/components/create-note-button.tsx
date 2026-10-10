"use client"

import { useRef, useState, type SubmitEvent } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAdminArticle, saveAdminArticleDraft } from "@/features/admin/articles/articles-api"
import type { AdminArticleDetail, ArticleAudience } from "@/features/admin/articles/types"

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const audiences: { label: string; value: ArticleAudience }[] = [
  { label: "public", value: "public" },
  { label: "users", value: "user" },
  { label: "admin", value: "admin" },
]

export function CreateNoteButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [audience, setAudience] = useState<ArticleAudience | null>(null)
  const [error, setError] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const createdRef = useRef<AdminArticleDetail | null>(null)

  function resetForm() {
    setTitle("")
    setSlug("")
    setAudience(null)
    setError("")
    createdRef.current = null
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = title.trim()
    const nextSlug = slug.trim().toLowerCase()
    if (!nextTitle || [...nextTitle].length > 200) {
      setError("标题必填，且不能超过 200 个字符。")
      return
    }
    if (!nextSlug || !slugPattern.test(nextSlug) || nextSlug.length > 200) {
      setError("唯一标识必填，只能包含小写字母、数字和连字符。")
      return
    }
    if (!audience) {
      setError("权限必填。")
      return
    }

    setIsCreating(true)
    setError("")

    let created = false

    try {
      const article = createdRef.current ?? (await createAdminArticle(nextSlug, audience))
      createdRef.current = article
      await saveAdminArticleDraft(article.id, {
        slug: article.slug,
        audience,
        title: nextTitle,
        summary: "",
        markdown: "",
        coverFileKey: "",
        expectedVersion: article.draft.version,
      })
      created = true
      router.push(`/admin/notes/${article.id}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "新建失败")
    } finally {
      if (!created) {
        setIsCreating(false)
      }
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" className="size-4" />
        新建
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isCreating) {
            setOpen(nextOpen)
            if (!nextOpen) {
              resetForm()
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建笔记</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="note-title">标题</Label>
              <Input
                id="note-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="note-slug">唯一标识</Label>
              <Input
                id="note-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="first-post"
                autoComplete="off"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="note-audience">权限</Label>
              <Select
                value={audience}
                onValueChange={(value) => {
                  if (value === "public" || value === "user" || value === "admin") {
                    setAudience(value)
                  }
                }}
              >
                <SelectTrigger id="note-audience" className="w-full" aria-required="true">
                  <SelectValue placeholder="选择权限" />
                </SelectTrigger>
                <SelectContent>
                  {audiences.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isCreating} onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "新建中…" : "新建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
