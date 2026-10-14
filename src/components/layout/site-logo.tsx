"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type MouseEvent, useState } from "react"

import { BrandLogo } from "@/components/layout/brand-logo"
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
      className="w-fit rounded-full transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={handleClick}
    >
      <BrandLogo
        priority
        className={cn(isSpinning && "animate-[spin_0.7s_ease-in-out]")}
        onAnimationEnd={() => setIsSpinning(false)}
      />
    </Link>
  )
}
