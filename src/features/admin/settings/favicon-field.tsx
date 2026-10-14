"use client"

import { useRef, useState } from "react"
import { LoaderCircle } from "lucide-react"

import { Label } from "@/components/ui/label"
import { siteConfig } from "@/config/site"
import { deleteFile, fileUrl, uploadFile } from "@/features/admin/files/files-api"
import { cn } from "@/lib/utils"

const icoMimeTypes = new Set(["image/x-icon", "image/vnd.microsoft.icon"])

async function isFaviconIco(file: File) {
  if (!file.name.toLowerCase().endsWith(".ico")) {
    return false
  }
  const type = file.type.toLowerCase()
  if (type.startsWith("image/") && !icoMimeTypes.has(type)) {
    return false
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  return header.length === 4 && header[0] === 0 && header[1] === 0 && header[2] === 1 && header[3] === 0
}

export function FaviconField() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [version, setVersion] = useState("")
  const [missing, setMissing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const href = fileUrl(siteConfig.faviconKey)
  const src = version ? `${href}?v=${encodeURIComponent(version)}` : href

  async function handleFile(file: File) {
    setError("")
    setSaved(false)
    if (!(await isFaviconIco(file))) {
      setError("图片类型不一致，只能上传 favicon.ico。")
      return
    }

    setUploading(true)
    try {
      const ico = new File([file], siteConfig.faviconKey, { type: "image/x-icon" })
      const uploaded = await uploadFile(ico, { key: siteConfig.faviconKey })
      if (uploaded.key !== siteConfig.faviconKey) {
        await deleteFile(uploaded.key).catch(() => undefined)
        throw new Error("文件服务没有按固定 key 保存 favicon。")
      }
      const nextVersion = uploaded.etag || uploaded.last_modified || String(Date.now())
      setVersion(nextVersion)
      setMissing(false)
      setSaved(true)
      const icon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
      if (icon) {
        icon.href = `${href}?v=${encodeURIComponent(nextVersion)}`
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="settings-favicon">Favicon</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          aria-label="上传 favicon"
          onClick={() => inputRef.current?.click()}
          className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-muted transition-colors hover:bg-accent disabled:cursor-default disabled:opacity-50"
        >
          {uploading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className={cn("size-8", missing && "hidden")}
              onLoad={() => setMissing(false)}
              onError={() => setMissing(true)}
            />
          )}
        </button>
        <input
          id="settings-favicon"
          ref={inputRef}
          type="file"
          accept=".ico,image/x-icon,image/vnd.microsoft.icon"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (file) {
              void handleFile(file)
            }
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">点击图片上传 favicon.ico</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">网站图标已更新。</p> : null}
    </div>
  )
}
