"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type MouseEvent, useState } from "react"

import { siteConfig } from "@/config/site"
import { requestChatReload } from "@/features/chat/chat-reload"
import { cn } from "@/lib/utils"

export function SiteLogo() {
  const pathname = usePathname()
  const [isSpinning, setIsSpinning] = useState(false)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    setIsSpinning(false)
    requestAnimationFrame(() => {
      setIsSpinning(true)
    })

    if (pathname !== "/chat") {
      return
    }

    event.preventDefault()
    requestChatReload()
  }

  return (
    <Link
      href="/chat"
      aria-label={`${siteConfig.name} Chat`}
      className="w-fit rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={handleClick}
    >
      <Image
        src={siteConfig.logo}
        alt=""
        width={32}
        height={32}
        className={cn("size-8 rounded-full", isSpinning && "animate-[spin_0.7s_ease-in-out]")}
        onAnimationEnd={() => setIsSpinning(false)}
        priority
      />
    </Link>
  )
}
