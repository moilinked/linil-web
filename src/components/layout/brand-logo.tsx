"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import { siteConfig } from "@/config/site"
import { fileUrl } from "@/features/admin/files/files-api"
import { cn } from "@/lib/utils"

export function BrandLogo({
  className,
  priority,
  onAnimationEnd,
}: {
  className?: string
  priority?: boolean
  onAnimationEnd?: () => void
}) {
  const uploaded = fileUrl(siteConfig.logoKey)
  const [src, setSrc] = useState(uploaded)

  useEffect(() => {
    function onUpdate() {
      setSrc(uploaded)
    }

    window.addEventListener("site-logo-updated", onUpdate)
    return () => window.removeEventListener("site-logo-updated", onUpdate)
  }, [uploaded])

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 rounded-full object-contain", className)}
      priority={priority}
      onAnimationEnd={onAnimationEnd}
      onError={() => setSrc((current) => (current === siteConfig.logo ? current : siteConfig.logo))}
    />
  )
}
