"use client"

import { useState } from "react"
import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { maxTagCount, maxTagLength, normalizeTag, presetTags, tagLabel } from "@/features/admin/articles/tags"

export function NoteTagsField({
  id,
  tags,
  disabled,
  onChange,
}: {
  id: string
  tags: string[]
  disabled: boolean
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")

  function addTag(value: string) {
    const tag = normalizeTag(value)
    if (!tag) {
      setDraft("")
      setError("")
      return
    }
    if ([...tag].length > maxTagLength) {
      setError("Each tag must be 50 characters or fewer.")
      return
    }
    if (tags.includes(tag)) {
      setDraft("")
      setError("")
      return
    }
    if (tags.length >= maxTagCount) {
      setError("A note can have at most 20 tags.")
      return
    }

    onChange([...tags, tag])
    setDraft("")
    setError("")
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item !== tag))
    setError("")
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tagLabel(tag)}
              <button
                type="button"
                className="rounded-sm"
                aria-label={`Remove ${tagLabel(tag)}`}
                disabled={disabled}
                onClick={() => removeTag(tag)}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {presetTags.map((tag) => {
          const selected = tags.includes(tag.value)
          return (
            <Button
              key={tag.value}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              disabled={disabled || (!selected && tags.length >= maxTagCount)}
              onClick={() => (selected ? removeTag(tag.value) : addTag(tag.value))}
            >
              {tag.label}
            </Button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          disabled={disabled}
          placeholder="Custom tag"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return
            }
            event.preventDefault()
            event.stopPropagation()
            addTag(draft)
          }}
        />
        <Button type="button" variant="outline" disabled={disabled} onClick={() => addTag(draft)}>
          Add
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
