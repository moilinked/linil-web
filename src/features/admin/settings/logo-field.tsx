"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { LoaderCircle } from "lucide-react"

import { Label } from "@/components/ui/label"
import { siteConfig } from "@/config/site"
import { deleteFile, fileUrl, uploadFile } from "@/features/admin/files/files-api"

const logoMimeTypes = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
])

function logoExtension(name: string) {
  const dot = name.lastIndexOf(".")
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase()
}

function isLogoImage(file: File) {
  const extension = logoExtension(file.name)
  const mime = logoMimeTypes.get(extension)
  if (!mime) {
    return null
  }
  const type = file.type.toLowerCase()
  if (type.startsWith("image/") && type !== mime) {
    return null
  }
  return mime
}

export function LogoField() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const href = fileUrl(siteConfig.logoKey)

  async function handleFile(file: File) {
    setError("")
    setSaved(false)
    const mime = isLogoImage(file)
    if (!mime) {
      setError("图片类型不一致，只能上传 PNG、JPEG、GIF、WebP、AVIF 或 BMP。")
      return
    }

    setUploading(true)
    try {
      const logo = new File([file], siteConfig.logoKey, { type: mime })
      const uploaded = await uploadFile(logo, { key: siteConfig.logoKey })
      if (uploaded.key !== siteConfig.logoKey) {
        await deleteFile(uploaded.key).catch(() => undefined)
        throw new Error("文件服务没有按固定 key 保存 logo。")
      }
      setPreviewKey((current) => current + 1)
      setSaved(true)
      window.dispatchEvent(new Event("site-logo-updated"))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="settings-logo">Logo</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          aria-label="上传 logo"
          onClick={() => inputRef.current?.click()}
          className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-muted transition-colors hover:bg-accent disabled:cursor-default disabled:opacity-50"
        >
          {uploading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Image key={previewKey} src={href} alt="" width={32} height={32} className="size-8 object-contain" />
          )}
        </button>
        <input
          id="settings-logo"
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp"
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
      <p className="text-sm text-muted-foreground">点击图片上传，只接受 PNG、JPEG、WebP。</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">网站 Logo 已更新。</p> : null}
    </div>
  )
}
